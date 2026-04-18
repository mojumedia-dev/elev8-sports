import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { isTeamCoach, isTeamMember } from '../middleware/teamAccess';
import { parseGameChangerCSV, calculateStatSummary } from '../utils/gamechangerParser';

const router = Router();

const MAX_CSV_BYTES = 5 * 1024 * 1024;

async function canAccessChild(userId: string, isAdmin: boolean, childId: string): Promise<boolean> {
  if (isAdmin) return true;
  const owns = await prisma.child.findFirst({ where: { id: childId, parentId: userId }, select: { id: true } });
  if (owns) return true;
  const coach = await prisma.teamMember.findFirst({
    where: {
      userId,
      role: 'COACH',
      team: { members: { some: { childId } } },
    },
    select: { id: true },
  });
  return !!coach;
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z\s,'-]/g, '').replace(/\s+/g, ' ').trim();
}

interface RosterEntry {
  childId: string;
  firstName: string;
  lastName: string;
}

function matchPlayerToRoster(playerName: string, roster: RosterEntry[]): RosterEntry | null {
  const norm = normalizeName(playerName);
  if (!norm) return null;

  // Strip "last, first" → "first last"
  let candidate = norm;
  if (candidate.includes(',')) {
    const [last, first] = candidate.split(',').map(s => s.trim());
    if (first && last) candidate = `${first} ${last}`;
  }
  const parts = candidate.split(' ').filter(Boolean);
  const candFirst = parts[0] || '';
  const candLast = parts[parts.length - 1] || '';

  // 1. Exact full name match
  for (const r of roster) {
    const full = normalizeName(`${r.firstName} ${r.lastName}`);
    if (full === candidate) return r;
  }
  // 2. Exact first + last match
  for (const r of roster) {
    if (normalizeName(r.firstName) === candFirst && normalizeName(r.lastName) === candLast) return r;
  }
  // 3. First + last initial match (e.g., "John S")
  if (candLast.length === 1) {
    const matches = roster.filter(r =>
      normalizeName(r.firstName) === candFirst && normalizeName(r.lastName).startsWith(candLast)
    );
    if (matches.length === 1) return matches[0];
  }
  // 4. Substring match — only when unambiguous
  const subs = roster.filter(r => {
    const full = normalizeName(`${r.firstName} ${r.lastName}`);
    return full.includes(candidate) || candidate.includes(full);
  });
  if (subs.length === 1) return subs[0];

  return null;
}

const uploadCsvSchema = z.object({
  csvData: z.string().min(1).max(MAX_CSV_BYTES),
  childId: z.string().min(1),
  sport: z.enum(['BASEBALL', 'SOFTBALL']).optional(),
  season: z.string().max(80).optional(),
  teamName: z.string().max(200).optional(),
});

/**
 * POST /upload-csv
 * Parent uploads a CSV scoped to one of their kids.
 */
router.post('/upload-csv', authenticate, async (req: Request, res: Response) => {
  const parsed = uploadCsvSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const { csvData, childId, sport, season, teamName } = parsed.data;

  const child = await prisma.child.findFirst({ where: { id: childId, parentId: req.user!.userId } });
  if (!child) { res.status(404).json({ error: 'Child not found or not yours' }); return; }

  try {
    const result = parseGameChangerCSV(csvData, sport);
    const resolvedSport = sport || result.sport;
    const resolvedSeason = season || result.season;
    const resolvedTeamName = teamName || result.teamName;

    const gcImport = await prisma.gameChangerImport.create({
      data: {
        userId: req.user!.userId,
        childId,
        sport: resolvedSport as any,
        importType: 'CSV',
        scope: 'CHILD',
        rawData: { csv: csvData },
        parsedStats: JSON.parse(JSON.stringify({ players: result.players, rowCount: result.rowCount })),
        season: resolvedSeason,
        teamName: resolvedTeamName,
      },
    });

    const childFullName = `${child.firstName} ${child.lastName}`.toLowerCase();
    const uniquePlayerNames = [...new Set(result.players.map(p => p.playerName))];
    let playerStats = result.players;
    if (uniquePlayerNames.length > 1) {
      playerStats = result.players.filter(p =>
        p.playerName.toLowerCase().includes(childFullName) ||
        childFullName.includes(p.playerName.toLowerCase()) ||
        p.playerName.toLowerCase().includes(child.firstName.toLowerCase())
      );
      if (playerStats.length === 0) playerStats = result.players;
    }

    const created = await Promise.all(playerStats.map(stat =>
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
    ));

    res.status(201).json({
      import: gcImport,
      statsCreated: created.length,
      playersFound: uniquePlayerNames,
      matchedPlayer: playerStats.length < result.players.length ? childFullName : 'all',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to parse CSV' });
  }
});

const uploadTeamCsvSchema = z.object({
  csvData: z.string().min(1).max(MAX_CSV_BYTES),
  teamId: z.string().min(1),
  sport: z.enum(['BASEBALL', 'SOFTBALL']).optional(),
  season: z.string().max(80).optional(),
});

/**
 * POST /upload-team-csv
 * Coach uploads CSV for an entire team. Stats distribute to roster by name match;
 * unmatched rows become UnclaimedStat rows for parents to claim.
 */
router.post('/upload-team-csv', authenticate, async (req: Request, res: Response) => {
  const parsed = uploadTeamCsvSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const { csvData, teamId, sport, season } = parsed.data;

  if (!req.user!.isAdmin && !(await isTeamCoach(req.user!.userId, teamId))) {
    res.status(403).json({ error: 'Coach access required' }); return;
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: { include: { child: { select: { id: true, firstName: true, lastName: true } } } } },
  });
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }

  const roster: RosterEntry[] = team.members
    .map(m => {
      if (m.child) return { childId: m.child.id, firstName: m.child.firstName, lastName: m.child.lastName };
      if (m.firstName && m.lastName && m.childId) return { childId: m.childId, firstName: m.firstName, lastName: m.lastName };
      return null;
    })
    .filter((x): x is RosterEntry => !!x);

  try {
    const result = parseGameChangerCSV(csvData, sport);
    const resolvedSport = sport || result.sport;
    const resolvedSeason = season || result.season;
    const resolvedTeamName = result.teamName || team.name;

    const gcImport = await prisma.gameChangerImport.create({
      data: {
        userId: req.user!.userId,
        teamId,
        sport: resolvedSport as any,
        importType: 'CSV',
        scope: 'TEAM',
        rawData: { csv: csvData },
        parsedStats: JSON.parse(JSON.stringify({ players: result.players, rowCount: result.rowCount })),
        season: resolvedSeason,
        teamName: resolvedTeamName,
      },
    });

    const matched: { stat: typeof result.players[number]; childId: string }[] = [];
    const unmatched: typeof result.players = [];
    const matchCache = new Map<string, RosterEntry | null>();

    for (const stat of result.players) {
      let m = matchCache.get(stat.playerName);
      if (m === undefined) {
        m = matchPlayerToRoster(stat.playerName, roster);
        matchCache.set(stat.playerName, m);
      }
      if (m) matched.push({ stat, childId: m.childId });
      else unmatched.push(stat);
    }

    const created = await Promise.all(matched.map(({ stat, childId }) =>
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
    ));

    const unclaimedCreated = await Promise.all(unmatched.map(stat =>
      prisma.unclaimedStat.create({
        data: {
          importId: gcImport.id,
          teamId,
          playerName: stat.playerName,
          sport: resolvedSport as any,
          season: resolvedSeason,
          statType: stat.statType,
          statValue: stat.statValue,
          gameDate: stat.gameDate ? new Date(stat.gameDate) : null,
        },
      })
    ));

    const unmatchedNames = [...new Set(unmatched.map(u => u.playerName))];
    const matchedNames = [...new Set(matched.map(m => m.stat.playerName))];

    res.status(201).json({
      import: gcImport,
      statsCreated: created.length,
      unclaimedCreated: unclaimedCreated.length,
      matchedPlayers: matchedNames,
      unmatchedPlayers: unmatchedNames,
      rosterSize: roster.length,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to parse CSV' });
  }
});

/**
 * GET /unclaimed?teamId=...
 * Returns unclaimed stat rows for a team, grouped by player name.
 * Accessible to anyone on the team (so parents can find their kid's row).
 */
router.get('/unclaimed', authenticate, async (req: Request, res: Response) => {
  const teamId = String(req.query.teamId || '');
  if (!teamId) { res.status(400).json({ error: 'teamId required' }); return; }
  if (!req.user!.isAdmin && !(await isTeamMember(req.user!.userId, teamId))) {
    res.status(403).json({ error: 'Not a member of this team' }); return;
  }

  const rows = await prisma.unclaimedStat.findMany({
    where: { teamId, claimed: false },
    orderBy: [{ playerName: 'asc' }, { gameDate: 'desc' }],
  });

  const grouped: Record<string, typeof rows> = {};
  for (const r of rows) {
    (grouped[r.playerName] ||= []).push(r);
  }
  const out = Object.entries(grouped).map(([playerName, stats]) => ({
    playerName,
    statCount: stats.length,
    sport: stats[0].sport,
    season: stats[0].season,
    statIds: stats.map(s => s.id),
  }));
  res.json(out);
});

const claimSchema = z.object({
  childId: z.string().min(1),
  statIds: z.array(z.string().min(1)).min(1).max(500),
});

/**
 * POST /claim
 * Parent claims a set of unclaimed stat rows for their child.
 */
router.post('/claim', authenticate, async (req: Request, res: Response) => {
  const parsed = claimSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const { childId, statIds } = parsed.data;

  const child = await prisma.child.findFirst({ where: { id: childId, parentId: req.user!.userId } });
  if (!child && !req.user!.isAdmin) { res.status(404).json({ error: 'Child not found or not yours' }); return; }

  const rows = await prisma.unclaimedStat.findMany({ where: { id: { in: statIds }, claimed: false } });
  if (rows.length === 0) { res.status(404).json({ error: 'No claimable stats found' }); return; }

  // All claimed rows must be on a team the child is on (or admin override)
  const teamIds = [...new Set(rows.map(r => r.teamId).filter((x): x is string => !!x))];
  if (!req.user!.isAdmin) {
    const childTeams = await prisma.teamMember.findMany({
      where: { childId, teamId: { in: teamIds } },
      select: { teamId: true },
    });
    const allowed = new Set(childTeams.map(t => t.teamId));
    if (!teamIds.every(t => allowed.has(t))) {
      res.status(403).json({ error: 'Child is not on the team(s) for these stats' }); return;
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const playerStats = await Promise.all(rows.map(r =>
      tx.playerStats.create({
        data: {
          childId,
          sport: r.sport,
          season: r.season,
          statType: r.statType,
          statValue: r.statValue,
          source: 'GAMECHANGER',
          importId: r.importId,
          gameDate: r.gameDate,
        },
      })
    ));
    await tx.unclaimedStat.updateMany({
      where: { id: { in: rows.map(r => r.id) } },
      data: { claimed: true, claimedByChildId: childId, claimedAt: new Date() },
    });
    return playerStats;
  });

  res.status(201).json({ statsCreated: created.length });
});

const logGameSchema = z.object({
  childId: z.string().min(1),
  sport: z.enum(['BASEBALL', 'SOFTBALL', 'BASKETBALL', 'SOCCER', 'FLAG_FOOTBALL', 'OTHER']),
  season: z.string().max(80).optional(),
  gameDate: z.string().optional(),
  stats: z.record(z.string().max(40), z.number().min(-1000).max(100000)).refine(
    (s) => Object.keys(s).length > 0 && Object.keys(s).length <= 50,
    'Need at least one stat (max 50)',
  ),
});

/**
 * POST /log-game
 * Parent manually logs per-game stats for their child.
 */
router.post('/log-game', authenticate, async (req: Request, res: Response) => {
  const parsed = logGameSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const { childId, sport, season, gameDate, stats } = parsed.data;

  const child = await prisma.child.findFirst({ where: { id: childId, parentId: req.user!.userId } });
  if (!child && !req.user!.isAdmin) { res.status(404).json({ error: 'Child not found or not yours' }); return; }

  const date = gameDate ? new Date(gameDate) : new Date();
  if (isNaN(date.getTime())) { res.status(400).json({ error: 'Invalid gameDate' }); return; }

  const created = await Promise.all(Object.entries(stats).map(([statType, statValue]) =>
    prisma.playerStats.create({
      data: {
        childId,
        sport,
        season,
        statType,
        statValue,
        source: 'MANUAL',
        gameDate: date,
      },
    })
  ));

  res.status(201).json({ statsCreated: created.length });
});

/**
 * GET /stats/:childId
 */
router.get('/stats/:childId', authenticate, async (req: Request, res: Response) => {
  const childId = req.params.childId as string;
  const { sport, season, source } = req.query;

  if (!(await canAccessChild(req.user!.userId, !!req.user!.isAdmin, childId))) {
    res.status(403).json({ error: 'No access to this child' }); return;
  }

  const where: any = { childId };
  if (sport) where.sport = sport as string;
  if (season) where.season = season as string;
  if (source) where.source = source as string;

  const stats = await prisma.playerStats.findMany({
    where,
    orderBy: [{ gameDate: 'desc' }, { createdAt: 'desc' }],
    include: { import: { select: { id: true, teamName: true, importedAt: true } } },
  });
  res.json(stats);
});

/**
 * GET /stats/:childId/summary
 */
router.get('/stats/:childId/summary', authenticate, async (req: Request, res: Response) => {
  const childId = req.params.childId as string;
  const { sport, season } = req.query;

  if (!(await canAccessChild(req.user!.userId, !!req.user!.isAdmin, childId))) {
    res.status(403).json({ error: 'No access to this child' }); return;
  }

  const where: any = { childId };
  if (sport) where.sport = sport as string;
  if (season) where.season = season as string;

  const stats = await prisma.playerStats.findMany({ where });
  const summary = calculateStatSummary(
    stats.map(s => ({ statType: s.statType, statValue: s.statValue, gameDate: s.gameDate }))
  );

  const imports = await prisma.gameChangerImport.findMany({
    where: { OR: [{ childId }, { team: { members: { some: { childId } } } }] },
    orderBy: { importedAt: 'desc' },
    select: { id: true, sport: true, season: true, teamName: true, importedAt: true, scope: true },
    take: 10,
  });

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
 */
router.get('/imports', authenticate, async (req: Request, res: Response) => {
  const imports = await prisma.gameChangerImport.findMany({
    where: { userId: req.user!.userId },
    orderBy: { importedAt: 'desc' },
    include: {
      child: { select: { id: true, firstName: true, lastName: true } },
      team: { select: { id: true, name: true } },
      _count: { select: { stats: true, unclaimed: true } },
    },
  });
  res.json(imports);
});

export default router;
