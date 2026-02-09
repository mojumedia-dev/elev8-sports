import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, async (req: Request, res: Response) => {
  const { eventId, status } = req.body;
  const rsvp = await prisma.rsvp.upsert({
    where: { eventId_userId: { eventId, userId: req.user!.userId } },
    update: { status },
    create: { eventId, userId: req.user!.userId, status },
  });
  res.json(rsvp);
});

router.get('/event/:eventId', authenticate, async (req: Request, res: Response) => {
  const rsvps = await prisma.rsvp.findMany({
    where: { eventId: req.params.eventId as string },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  res.json(rsvps);
});

export default router;
