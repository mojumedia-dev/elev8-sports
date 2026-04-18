import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';
import { isTeamCoach, isTeamMember, isOrgAdmin } from '../middleware/teamAccess';

const router = Router();

const eventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  type: z.enum(['PRACTICE', 'GAME', 'TRYOUT']),
  startTime: z.string().min(1),
  endTime: z.string().optional().nullable(),
  location: z.string().trim().max(300).optional().nullable(),
  teamId: z.string().max(40).optional().nullable(),
  organizationId: z.string().max(40).optional().nullable(),
});

async function canEditEvent(userId: string, isAdmin: boolean, eventId: string): Promise<boolean> {
  if (isAdmin) return true;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { teamId: true, organizationId: true } });
  if (!event) return false;
  if (event.teamId && (await isTeamCoach(userId, event.teamId))) return true;
  if (event.organizationId && (await isOrgAdmin(userId, event.organizationId))) return true;
  return false;
}

router.get('/', authenticate, async (req: Request, res: Response) => {
  const { teamId } = req.query;
  if (teamId) {
    const tid = String(teamId);
    if (!req.user!.isAdmin && !(await isTeamMember(req.user!.userId, tid))) {
      res.status(403).json({ error: 'Not a member of this team' }); return;
    }
    const events = await prisma.event.findMany({ where: { teamId: tid }, include: { team: true, _count: { select: { rsvps: true } } }, orderBy: { startTime: 'asc' } });
    res.json(events);
    return;
  }
  const events = await prisma.event.findMany({
    where: { team: { members: { some: { userId: req.user!.userId } } } },
    include: { team: true, _count: { select: { rsvps: true } } },
    orderBy: { startTime: 'asc' },
  });
  res.json(events);
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id as string },
    include: { team: true, rsvps: { include: { user: { select: { firstName: true, lastName: true } } } } },
  });
  if (!event) { res.status(404).json({ error: 'Not found' }); return; }
  if (!req.user!.isAdmin) {
    const member = event.teamId ? await isTeamMember(req.user!.userId, event.teamId) : false;
    const orgAdmin = event.organizationId ? await isOrgAdmin(req.user!.userId, event.organizationId) : false;
    if (!member && !orgAdmin) { res.status(403).json({ error: 'No access to this event' }); return; }
  }
  res.json(event);
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const data = parsed.data;
  if (!data.teamId && !data.organizationId) {
    res.status(400).json({ error: 'teamId or organizationId required' }); return;
  }
  if (!req.user!.isAdmin) {
    const okTeam = data.teamId ? await isTeamCoach(req.user!.userId, data.teamId) : false;
    const okOrg = data.organizationId ? await isOrgAdmin(req.user!.userId, data.organizationId) : false;
    if (!okTeam && !okOrg) { res.status(403).json({ error: 'Coach or org admin required' }); return; }
  }
  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description ?? undefined,
      type: data.type,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : null,
      location: data.location ?? undefined,
      teamId: data.teamId || null,
      organizationId: data.organizationId || null,
    },
  });
  res.status(201).json(event);
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const eventId = req.params.id as string;
  if (!(await canEditEvent(req.user!.userId, !!req.user!.isAdmin, eventId))) {
    res.status(403).json({ error: 'Not authorized to edit this event' }); return;
  }
  const parsed = eventSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const d = parsed.data;
  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      title: d.title,
      description: d.description ?? undefined,
      type: d.type,
      startTime: d.startTime ? new Date(d.startTime) : undefined,
      endTime: d.endTime ? new Date(d.endTime) : undefined,
      location: d.location ?? undefined,
    },
  });
  res.json(event);
});

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const eventId = req.params.id as string;
  if (!(await canEditEvent(req.user!.userId, !!req.user!.isAdmin, eventId))) {
    res.status(403).json({ error: 'Not authorized to delete this event' }); return;
  }
  await prisma.event.delete({ where: { id: eventId } });
  res.json({ success: true });
});

export default router;
