import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { isTeamMember } from '../middleware/teamAccess';

const router = Router();

const messageSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  teamId: z.string().max(40).optional().nullable(),
  recipientId: z.string().max(40).optional().nullable(),
});

router.get('/team/:teamId', authenticate, async (req: Request, res: Response) => {
  const teamId = req.params.teamId as string;
  if (!req.user!.isAdmin && !(await isTeamMember(req.user!.userId, teamId))) {
    res.status(403).json({ error: 'Not a member of this team' }); return;
  }
  const messages = await prisma.message.findMany({
    where: { teamId },
    include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });
  res.json(messages);
});

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
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const { content, teamId, recipientId } = parsed.data;
  if (!teamId && !recipientId) { res.status(400).json({ error: 'teamId or recipientId required' }); return; }

  if (teamId && !req.user!.isAdmin && !(await isTeamMember(req.user!.userId, teamId))) {
    res.status(403).json({ error: 'Not a member of this team' }); return;
  }
  if (recipientId && !req.user!.isAdmin) {
    // DM is allowed if sender + recipient share at least one team
    const sharedTeam = await prisma.teamMember.findFirst({
      where: {
        userId: recipientId,
        team: { members: { some: { userId: req.user!.userId } } },
      },
      select: { id: true },
    });
    if (!sharedTeam) { res.status(403).json({ error: 'You can only DM users on a shared team' }); return; }
  }

  const message = await prisma.message.create({
    data: { content, senderId: req.user!.userId, teamId: teamId || null, recipientId: recipientId || null },
    include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });
  res.status(201).json(message);
});

export default router;
