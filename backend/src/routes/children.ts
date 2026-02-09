import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  const children = await prisma.child.findMany({ where: { parentId: req.user!.userId }, include: { teamMembers: { include: { team: true } } } });
  res.json(children);
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const { firstName, lastName, dateOfBirth, sport, positions } = req.body;
  const child = await prisma.child.create({
    data: { firstName, lastName, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null, sport: sport || null, positions: positions || [], parentId: req.user!.userId },
  });
  res.status(201).json(child);
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const { firstName, lastName, dateOfBirth, sport, positions } = req.body;
  const child = await prisma.child.updateMany({
    where: { id: req.params.id as string, parentId: req.user!.userId },
    data: { firstName, lastName, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined, sport: sport !== undefined ? sport : undefined, positions: positions !== undefined ? positions : undefined },
  });
  if (child.count === 0) { res.status(404).json({ error: 'Child not found' }); return; }
  res.json({ success: true });
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  await prisma.child.deleteMany({ where: { id: req.params.id as string, parentId: req.user!.userId } });
  res.json({ success: true });
});

export default router;
