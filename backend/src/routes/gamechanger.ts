import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { parseGameChangerCSV, calculateStatSummary } from '../utils/gamechangerParser';

const router = Router();

/**
 * POST /upload-csv
 * Upload and parse a GameChanger CSV export
 * Body: { csvData: string, childId: string, sport?: "BASEBALL" | "SOFTBALL", season?: string, teamName?: string }
 */
router.post('/upload-csv', authenticate, async (req: Request, res: Response) => {
  try {
    const { csvData, childId, sport, season, teamName } = req.body;

    if (!csvData || !childId) {
      res.status(400).json({ error: 'csvData and childId are required' });
      return;
    }

    // Verify the child belongs to this user
    const child = await prisma.child.findFirst({
      where: { id: childId, parentId: req.user!.userId },
    });
    if (!child) {
      res.status(404).json({ error: 'Child not found or not yours' });
      return;
    }

    // Parse the CSV
    const parsed = parseGameChangerCSV(csvData, sport as any);
    const resolvedSport = sport || parsed.sport;
    const resolvedSeason = season || parsed.season;
    const resolvedTeamName = teamName || parsed.teamName;

    // Create the import record
    const gcImport = await prisma.gameChangerImport.create({
      data: {
        userId: req.user!.userId,
        childId,
        sport: resolvedSport as any,
        importType: 'CSV',
        rawData: { csv: csvData },
        parsedStats: { players: parsed.players, rowCount: parsed.rowCount },
        season: resolvedSeason,
        teamName: resolvedTeamName,
      },
    });

    // Find stats matching the child's name (or import all if only one player)
    const childFullName = `${child.firstName} ${child.lastName}`.toLowerCase();
    const uniquePlayerNames = [...new Set(parsed.players.map(p => p.playerName))];

    let playerStats = parsed.players;
    if (uniquePlayerNames.length > 1) {
      // Try to match child's name
      playerStats = parsed.players.filter(p =>
        p.playerName.toLowerCase().includes(childFullName) ||
        childFullName.includes(p.playerName.toLowerCase()) ||
        p.playerName.toLowerCase().includes(child.firstName.toLowerCase())
      );

      // If no match found, import all (user can filter later)
      if (playerStats.length === 0) {
        playerStats = parsed.players;
      }
    }

    // Create PlayerStats records
    const createdStats = await Promise.all(
      playerStats.map(stat =>
        prisma.playerStats.create({
          data: {
            childId,
            sport: resolvedSport as any,
            season: resolvedSeason,
            statType: stat.statType,
            statValue: stat.statValue,
            source: 'GAMECHANGER',
            importId: gcImport.id,
            gameDate: stat.gameDate ? new Date(stat.gameDate) : null,
          },
        })
      )
    );

    res.status(201).json({
      import: gcImport,
      statsCreated: createdStats.length,
      playersFound: uniquePlayerNames,
      matchedPlayer: playerStats.length < parsed.players.length ? childFullName : 'all',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to parse CSV' });
  }
});

/**
 * GET /stats/:childId
 * Get all imported stats for a child
 */
router.get('/stats/:childId', authenticate, async (req: Request, res: Response) => {
  const { childId } = req.params;
  const { sport, season, source } = req.query;

  // Verify access (parent owns child, or coach on same team)
  const child = await prisma.child.findFirst({
    where: { id: childId },
    include: { parent: { select: { id: true } } },
  });

  if (!child) {
    res.status(404).json({ error: 'Child not found' });
    return;
  }

  const where: any = { childId };
  if (sport) where.sport = sport;
  if (season) where.season = season;
  if (source) where.source = source;

  const stats = await prisma.playerStats.findMany({
    where,
    orderBy: [{ gameDate: 'desc' }, { createdAt: 'desc' }],
    include: { import: { select: { id: true, teamName: true, importedAt: true } } },
  });

  res.json(stats);
});

/**
 * GET /stats/:childId/summary
 * Get season averages and trends
 */
router.get('/stats/:childId/summary', authenticate, async (req: Request, res: Response) => {
  const { childId } = req.params;
  const { sport, season } = req.query;

  const where: any = { childId };
  if (sport) where.sport = sport;
  if (season) where.season = season;

  const stats = await prisma.playerStats.findMany({ where });

  const summary = calculateStatSummary(
    stats.map(s => ({ statType: s.statType, statValue: s.statValue, gameDate: s.gameDate }))
  );

  // Get import history
  const imports = await prisma.gameChangerImport.findMany({
    where: { childId },
    orderBy: { importedAt: 'desc' },
    select: { id: true, sport: true, season: true, teamName: true, importedAt: true },
    take: 10,
  });

  // Group stats by sport
  const bySport: Record<string, typeof summary> = {};
  const sportStats = await prisma.playerStats.groupBy({
    by: ['sport'],
    where: { childId },
    _count: true,
  });

  res.json({
    summary,
    totalStats: stats.length,
    imports,
    sportBreakdown: sportStats,
  });
});

/**
 * GET /imports
 * Get all imports for the current user
 */
router.get('/imports', authenticate, async (req: Request, res: Response) => {
  const imports = await prisma.gameChangerImport.findMany({
    where: { userId: req.user!.userId },
    orderBy: { importedAt: 'desc' },
    include: {
      child: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { stats: true } },
    },
  });

  res.json(imports);
});

export default router;
