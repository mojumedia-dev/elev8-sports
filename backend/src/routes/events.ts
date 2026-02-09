import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  const { teamId } = req.query;
  const where = teamId ? { teamId: String(teamId) } : { team: { members: { some: { userId: req.user!.userId } } } };
  const events = await prisma.event.findMany({ where, include: { team: true, _count: { select: { rsvps: true } } }, orderBy: { startTime: 'asc' } });
  res.json(events);
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id as string }, include: { team: true, rsvps: { include: { user: { select: { firstName: true, lastName: true } } } } } });
  if (!event) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(event);
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const { title, description, type, startTime, endTime, location, teamId, organizationId } = req.body;
  const event = await prisma.event.create({ data: { title, description, type, startTime: new Date(startTime), endTime: endTime ? new Date(endTime) : null, location, teamId: teamId || null, organizationId: organizationId || null } });
  res.status(201).json(event);
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const { title, description, type, startTime, endTime, location } = req.body;
  const event = await prisma.event.update({
    where: { id: req.params.id as string },
    data: { title, description, type, startTime: startTime ? new Date(startTime) : undefined, endTime: endTime ? new Date(endTime) : undefined, location },
  });
  res.json(event);
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  await prisma.event.delete({ where: { id: req.params.id as string } });
  res.json({ success: true });
});

export default router;
