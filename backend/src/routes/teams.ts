import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  if (req.user!.role === 'ORG_ADMIN') {
    const teams = await prisma.team.findMany({ include: { organization: true, _count: { select: { members: true, events: true } } } });
    res.json(teams);
    return;
  }
  const teams = await prisma.team.findMany({
    where: { members: { some: { userId: req.user!.userId } } },
    include: { organization: true, _count: { select: { members: true, events: true } } },
  });
  res.json(teams);
});

// Teams in user's city/zip, filtered by kids' sports if available
router.get('/nearby', authenticate, async (req: Request, res: Response) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { city: true, zipCode: true, children: { select: { sport: true } } },
  });
  if (!me?.city && !me?.zipCode) { res.json([]); return; }

  const locationFilters: any[] = [];
  if (me.city) {
    locationFilters.push({ city: { equals: me.city, mode: 'insensitive' } });
    locationFilters.push({ organization: { city: { equals: me.city, mode: 'insensitive' } } });
  }
  if (me.zipCode) {
    locationFilters.push({ zipCode: me.zipCode });
    locationFilters.push({ organization: { zipCode: me.zipCode } });
  }

  const sports = [...new Set(me.children.map(c => c.sport).filter((s): s is NonNullable<typeof s> => !!s))];
  const where: any = { OR: locationFilters };
  if (sports.length > 0) {
    where.AND = [{ sport: { in: sports } }];
  }

  const teams = await prisma.team.findMany({
    where,
    include: { organization: { select: { id: true, name: true, city: true, state: true } }, _count: { select: { members: true } } },
    take: 100,
  });
  res.json(teams);
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const team = await prisma.team.findUnique({
    where: { id: req.params.id as string },
    include: { organization: true, members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } }, child: true } }, events: { orderBy: { startTime: 'asc' } } },
  });
  if (!team) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(team);
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const { name, sport, season, ageGroup, city, state, zipCode, organizationId } = req.body;
  const team = await prisma.team.create({
    data: { name, sport, season, ageGroup, city, state, zipCode, organizationId },
  });
  await prisma.teamMember.create({ data: { teamId: team.id, userId: req.user!.userId, role: 'COACH' } });
  res.status(201).json(team);
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const { name, sport, season, ageGroup, city, state, zipCode } = req.body;
  const team = await prisma.team.update({ where: { id: req.params.id as string }, data: { name, sport, season, ageGroup, city, state, zipCode } });
  res.json(team);
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  await prisma.team.delete({ where: { id: req.params.id as string } });
  res.json({ success: true });
});

router.post('/:id/members', authenticate, async (req: Request, res: Response) => {
  const { userId, childId, role, firstName, lastName, position, jerseyNumber } = req.body;
  const member = await prisma.teamMember.create({
    data: { teamId: req.params.id as string, userId: userId || null, childId: childId || null, role: role || 'PLAYER', firstName, lastName, position, jerseyNumber },
  });
  res.status(201).json(member);
});

router.put('/:id/members/:memberId', authenticate, async (req: Request, res: Response) => {
  const { firstName, lastName, position, jerseyNumber, role } = req.body;
  const member = await prisma.teamMember.update({
    where: { id: req.params.memberId as string },
    data: { firstName, lastName, position, jerseyNumber, role: role || undefined },
  });
  res.json(member);
});

router.delete('/:id/members/:memberId', authenticate, async (req: Request, res: Response) => {
  await prisma.teamMember.delete({ where: { id: req.params.memberId as string } });
  res.json({ success: true });
});

export default router;
