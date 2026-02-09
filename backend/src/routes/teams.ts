import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  // Return teams the user is a member of, or all teams if org admin
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

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const team = await prisma.team.findUnique({
    where: { id: req.params.id as string },
    include: { organization: true, members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } }, child: true } }, events: { orderBy: { startTime: 'asc' } } },
  });
  if (!team) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(team);
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const { name, sport, season, ageGroup, organizationId } = req.body;
  const team = await prisma.team.create({
    data: { name, sport, season, ageGroup, organizationId },
  });
  // Add creator as coach
  await prisma.teamMember.create({ data: { teamId: team.id, userId: req.user!.userId, role: 'COACH' } });
  res.status(201).json(team);
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const { name, sport, season, ageGroup } = req.body;
  const team = await prisma.team.update({ where: { id: req.params.id as string }, data: { name, sport, season, ageGroup } });
  res.json(team);
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  await prisma.team.delete({ where: { id: req.params.id as string } });
  res.json({ success: true });
});

// Team member management
router.post('/:id/members', authenticate, async (req: Request, res: Response) => {
  const { userId, childId, role } = req.body;
  const member = await prisma.teamMember.create({ data: { teamId: req.params.id as string, userId, childId, role: role || 'PLAYER' } });
  res.status(201).json(member);
});

router.delete('/:id/members/:memberId', authenticate, async (req: Request, res: Response) => {
  await prisma.teamMember.delete({ where: { id: req.params.memberId } });
  res.json({ success: true });
});

export default router;
