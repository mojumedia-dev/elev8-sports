import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, requireRole } from '../middleware/auth';
import { isOrgAdmin } from '../middleware/teamAccess';

const router = Router();

const announcementSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(5000),
});

// Local feed — announcements from orgs matching user's location + their kids' sports
router.get('/feed', authenticate, async (req: Request, res: Response) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { city: true, state: true, zipCode: true, children: { select: { sport: true } } },
  });
  if (!me) { res.json([]); return; }

  const hasLocation = !!(me.city || me.zipCode);
  if (!hasLocation) { res.json([]); return; }

  const sports = [...new Set(me.children.map(c => c.sport).filter((s): s is any => !!s))];

  const locationFilter: any[] = [];
  if (me.city) locationFilter.push({ city: { equals: me.city, mode: 'insensitive' } });
  if (me.zipCode) locationFilter.push({ zipCode: me.zipCode });

  const whereOrg: any = { OR: locationFilter };
  if (sports.length > 0) {
    whereOrg.AND = [{ OR: [{ sports: { hasSome: sports } }, { sports: { isEmpty: true } }] }];
  }

  const announcements = await prisma.announcement.findMany({
    where: { organization: whereOrg },
    include: { organization: { select: { id: true, name: true, city: true, state: true, sports: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(announcements);
});

// Get announcements for an org
router.get('/:orgId', authenticate, async (req: Request, res: Response) => {
  const announcements = await prisma.announcement.findMany({
    where: { organizationId: req.params.orgId as string },
    orderBy: { createdAt: 'desc' },
  });
  res.json(announcements);
});

// Create announcement
router.post('/:orgId', authenticate, requireRole('ORG_ADMIN'), async (req: Request, res: Response) => {
  const orgId = req.params.orgId as string;
  if (!req.user!.isAdmin && !(await isOrgAdmin(req.user!.userId, orgId))) {
    res.status(403).json({ error: 'Not an admin of this organization' }); return;
  }
  const parsed = announcementSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const announcement = await prisma.announcement.create({
    data: { title: parsed.data.title, content: parsed.data.content, organizationId: orgId, authorId: req.user!.userId },
  });
  res.status(201).json(announcement);
});

// Update announcement
router.put('/:orgId/:id', authenticate, requireRole('ORG_ADMIN'), async (req: Request, res: Response) => {
  const orgId = req.params.orgId as string;
  if (!req.user!.isAdmin && !(await isOrgAdmin(req.user!.userId, orgId))) {
    res.status(403).json({ error: 'Not an admin of this organization' }); return;
  }
  const parsed = announcementSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const announcement = await prisma.announcement.updateMany({
    where: { id: req.params.id as string, organizationId: orgId },
    data: parsed.data,
  });
  if (announcement.count === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ success: true });
});

// Delete announcement
router.delete('/:orgId/:id', authenticate, requireRole('ORG_ADMIN'), async (req: Request, res: Response) => {
  const orgId = req.params.orgId as string;
  if (!req.user!.isAdmin && !(await isOrgAdmin(req.user!.userId, orgId))) {
    res.status(403).json({ error: 'Not an admin of this organization' }); return;
  }
  await prisma.announcement.deleteMany({ where: { id: req.params.id as string, organizationId: orgId } });
  res.json({ success: true });
});

export default router;
