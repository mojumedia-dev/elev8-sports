import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { isTeamMember, isTeamCoach, requireTeamCoach } from '../middleware/teamAccess';

const router = Router();

const teamSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sport: z.string().trim().min(1).max(40),
  season: z.string().trim().max(40).optional().nullable(),
  ageGroup: z.string().trim().max(40).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  state: z.string().trim().max(2).optional().nullable(),
  zipCode: z.string().trim().max(10).optional().nullable(),
  organizationId: z.string().trim().max(40).optional().nullable(),
});

const memberSchema = z.object({
  userId: z.string().max(40).optional().nullable(),
  childId: z.string().max(40).optional().nullable(),
  role: z.enum(['PLAYER', 'COACH', 'MANAGER']).optional(),
  firstName: z.string().trim().max(80).optional().nullable(),
  lastName: z.string().trim().max(80).optional().nullable(),
  position: z.string().trim().max(40).optional().nullable(),
  jerseyNumber: z.string().trim().max(10).optional().nullable(),
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  if (req.user!.isAdmin || req.user!.role === 'ORG_ADMIN') {
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
  const teamId = req.params.id as string;
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { organization: true, members: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } }, child: true } }, events: { orderBy: { startTime: 'asc' } } },
  });
  if (!team) { res.status(404).json({ error: 'Not found' }); return; }

  if (!req.user!.isAdmin) {
    const member = await isTeamMember(req.user!.userId, teamId);
    const orgAdmin = team.organizationId
      ? !!(await prisma.organization.findFirst({ where: { id: team.organizationId, adminId: req.user!.userId }, select: { id: true } }))
      : false;
    if (!member && !orgAdmin) { res.status(403).json({ error: 'Not a member of this team' }); return; }
  }

  // Strip member emails — only expose name + role to teammates
  const sanitized = {
    ...team,
    members: team.members.map(m => ({
      ...m,
      user: m.user ? { id: m.user.id, firstName: m.user.firstName, lastName: m.user.lastName, role: m.user.role } : null,
    })),
  };
  res.json(sanitized);
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const parsed = teamSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const data = parsed.data;

  if (data.organizationId && !req.user!.isAdmin) {
    const orgAdmin = await prisma.organization.findFirst({
      where: { id: data.organizationId, adminId: req.user!.userId },
      select: { id: true },
    });
    if (!orgAdmin) { res.status(403).json({ error: 'Not an admin of this organization' }); return; }
  }

  const team = await prisma.team.create({
    data: {
      name: data.name, sport: data.sport, season: data.season ?? undefined, ageGroup: data.ageGroup ?? undefined,
      city: data.city ?? undefined, state: data.state ?? undefined, zipCode: data.zipCode ?? undefined,
      organizationId: data.organizationId ?? undefined,
    },
  });
  await prisma.teamMember.create({ data: { teamId: team.id, userId: req.user!.userId, role: 'COACH' } });
  res.status(201).json(team);
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const teamId = req.params.id as string;
  if (!req.user!.isAdmin && !(await isTeamCoach(req.user!.userId, teamId))) {
    res.status(403).json({ error: 'Coach access required' }); return;
  }
  const parsed = teamSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const { organizationId, ...rest } = parsed.data;
  const team = await prisma.team.update({ where: { id: teamId }, data: rest });
  res.json(team);
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const teamId = req.params.id as string;
  if (!req.user!.isAdmin && !(await isTeamCoach(req.user!.userId, teamId))) {
    res.status(403).json({ error: 'Coach access required' }); return;
  }
  await prisma.team.delete({ where: { id: teamId } });
  res.json({ success: true });
});

router.post('/:id/members', authenticate, requireTeamCoach('id'), async (req: Request, res: Response) => {
  const parsed = memberSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const data = parsed.data;
  const member = await prisma.teamMember.create({
    data: {
      teamId: req.params.id as string,
      userId: data.userId || null,
      childId: data.childId || null,
      role: data.role || 'PLAYER',
      firstName: data.firstName ?? undefined,
      lastName: data.lastName ?? undefined,
      position: data.position ?? undefined,
      jerseyNumber: data.jerseyNumber ?? undefined,
    },
  });
  res.status(201).json(member);
});

router.put('/:id/members/:memberId', authenticate, requireTeamCoach('id'), async (req: Request, res: Response) => {
  const parsed = memberSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const data = parsed.data;
  const member = await prisma.teamMember.update({
    where: { id: req.params.memberId as string },
    data: {
      firstName: data.firstName ?? undefined,
      lastName: data.lastName ?? undefined,
      position: data.position ?? undefined,
      jerseyNumber: data.jerseyNumber ?? undefined,
      role: data.role || undefined,
    },
  });
  res.json(member);
});

router.delete('/:id/members/:memberId', authenticate, requireTeamCoach('id'), async (req: Request, res: Response) => {
  await prisma.teamMember.delete({ where: { id: req.params.memberId as string } });
  res.json({ success: true });
});

export default router;
