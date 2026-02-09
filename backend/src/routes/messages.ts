import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

// Team messages
router.get('/team/:teamId', authenticate, async (req: Request, res: Response) => {
  const messages = await prisma.message.findMany({
    where: { teamId: req.params.teamId as string },
    include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  res.json(messages);
});

// Direct messages
router.get('/dm/:userId', authenticate, async (req: Request, res: Response) => {
  const messages = await prisma.message.findMany({
    where: {
      teamId: null,
      OR: [
        { senderId: req.user!.userId, recipientId: req.params.userId as string },
        { senderId: req.params.userId as string, recipientId: req.user!.userId },
      ],
    },
    include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  res.json(messages);
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const { content, teamId, recipientId } = req.body;
  const message = await prisma.message.create({
    data: { content, senderId: req.user!.userId, teamId, recipientId },
    include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });
  res.status(201).json(message);
});

export default router;
