import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

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
  const { title, content } = req.body;
  if (!title || !content) { res.status(400).json({ error: 'Title and content required' }); return; }
  const announcement = await prisma.announcement.create({
    data: { title, content, organizationId: req.params.orgId as string, authorId: req.user!.userId },
  });
  res.status(201).json(announcement);
});

// Update announcement
router.put('/:orgId/:id', authenticate, requireRole('ORG_ADMIN'), async (req: Request, res: Response) => {
  const { title, content } = req.body;
  const announcement = await prisma.announcement.update({
    where: { id: req.params.id as string },
    data: { title, content },
  });
  res.json(announcement);
});

// Delete announcement
router.delete('/:orgId/:id', authenticate, requireRole('ORG_ADMIN'), async (req: Request, res: Response) => {
  await prisma.announcement.delete({ where: { id: req.params.id as string } });
  res.json({ success: true });
});

export default router;
