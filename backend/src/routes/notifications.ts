import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
});

router.put('/:id/read', authenticate, async (req: Request, res: Response) => {
  await prisma.notification.updateMany({ where: { id: req.params.id as string, userId: req.user!.userId }, data: { read: true } });
  res.json({ success: true });
});

router.put('/read-all', authenticate, async (req: Request, res: Response) => {
  await prisma.notification.updateMany({ where: { userId: req.user!.userId, read: false }, data: { read: true } });
  res.json({ success: true });
});

export default router;
