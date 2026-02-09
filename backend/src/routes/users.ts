import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, avatarUrl: true, createdAt: true },
  });
  res.json(user);
});

router.put('/me', authenticate, async (req: Request, res: Response) => {
  const { firstName, lastName, phone, avatarUrl } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { firstName, lastName, phone, avatarUrl },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, avatarUrl: true },
  });
  res.json(user);
});

router.get('/', authenticate, requireRole('ORG_ADMIN'), async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

export default router;
