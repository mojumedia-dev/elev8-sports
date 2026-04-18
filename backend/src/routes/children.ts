import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

const childSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  dateOfBirth: z.string().optional().nullable(),
  sport: z.enum(['BASEBALL', 'SOFTBALL', 'BASKETBALL', 'SOCCER', 'FLAG_FOOTBALL', 'OTHER']).optional().nullable(),
  positions: z.array(z.string().max(40)).max(20).optional(),
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  const children = await prisma.child.findMany({ where: { parentId: req.user!.userId }, include: { teamMembers: { include: { team: true } } } });
  res.json(children);
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const parsed = childSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const d = parsed.data;
  const child = await prisma.child.create({
    data: {
      firstName: d.firstName, lastName: d.lastName,
      dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : null,
      sport: d.sport ?? null,
      positions: d.positions ?? [],
      parentId: req.user!.userId,
    },
  });
  res.status(201).json(child);
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const parsed = childSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const d = parsed.data;
  const child = await prisma.child.updateMany({
    where: { id: req.params.id as string, parentId: req.user!.userId },
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : undefined,
      sport: d.sport,
      positions: d.positions,
    },
  });
  if (child.count === 0) { res.status(404).json({ error: 'Child not found' }); return; }
  res.json({ success: true });
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  await prisma.child.deleteMany({ where: { id: req.params.id as string, parentId: req.user!.userId } });
  res.json({ success: true });
});

export default router;
