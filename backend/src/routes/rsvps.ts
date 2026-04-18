import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { isTeamMember, isOrgAdmin } from '../middleware/teamAccess';

const router = Router();

const rsvpSchema = z.object({
  eventId: z.string().min(1).max(40),
  status: z.enum(['GOING', 'MAYBE', 'NOT_GOING']),
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const parsed = rsvpSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const { eventId, status } = parsed.data;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { teamId: true, organizationId: true } });
  if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
  if (!req.user!.isAdmin) {
    const member = event.teamId ? await isTeamMember(req.user!.userId, event.teamId) : false;
    const orgAdmin = event.organizationId ? await isOrgAdmin(req.user!.userId, event.organizationId) : false;
    if (!member && !orgAdmin) { res.status(403).json({ error: 'Not authorized to RSVP to this event' }); return; }
  }
  const rsvp = await prisma.rsvp.upsert({
    where: { eventId_userId: { eventId, userId: req.user!.userId } },
    update: { status },
    create: { eventId, userId: req.user!.userId, status },
  });
  res.json(rsvp);
});

router.get('/event/:eventId', authenticate, async (req: Request, res: Response) => {
  const eventId = req.params.eventId as string;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { teamId: true, organizationId: true } });
  if (!event) { res.status(404).json({ error: 'Event not found' }); return; }
  if (!req.user!.isAdmin) {
    const member = event.teamId ? await isTeamMember(req.user!.userId, event.teamId) : false;
    const orgAdmin = event.organizationId ? await isOrgAdmin(req.user!.userId, event.organizationId) : false;
    if (!member && !orgAdmin) { res.status(403).json({ error: 'No access to this event' }); return; }
  }
  const rsvps = await prisma.rsvp.findMany({
    where: { eventId },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
  res.json(rsvps);
});

export default router;
