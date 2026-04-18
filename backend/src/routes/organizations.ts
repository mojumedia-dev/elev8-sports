import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (_req: Request, res: Response) => {
  const orgs = await prisma.organization.findMany({ include: { admin: { select: { firstName: true, lastName: true } }, _count: { select: { teams: true } } } });
  res.json(orgs);
});

// Orgs in user's city/zip, optionally filtered by kids' sports
router.get('/nearby', authenticate, async (req: Request, res: Response) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { city: true, zipCode: true, children: { select: { sport: true } } },
  });
  if (!me?.city && !me?.zipCode) { res.json([]); return; }

  const locationFilter: any[] = [];
  if (me.city) locationFilter.push({ city: { equals: me.city, mode: 'insensitive' } });
  if (me.zipCode) locationFilter.push({ zipCode: me.zipCode });

  const sports = [...new Set(me.children.map(c => c.sport).filter((s): s is any => !!s))];
  const where: any = { OR: locationFilter };
  if (sports.length > 0) {
    where.AND = [{ OR: [{ sports: { hasSome: sports } }, { sports: { isEmpty: true } }] }];
  }

  const orgs = await prisma.organization.findMany({
    where,
    include: { admin: { select: { firstName: true, lastName: true } }, _count: { select: { teams: true } } },
  });
  res.json(orgs);
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const org = await prisma.organization.findUnique({ where: { id: req.params.id as string }, include: { teams: true, admin: { select: { firstName: true, lastName: true, email: true } } } });
  if (!org) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(org);
});

router.post('/', authenticate, requireRole('ORG_ADMIN'), async (req: Request, res: Response) => {
  const { name, description, logoUrl, website, city, state, zipCode, ageDivisions, seasons, sports } = req.body;
  const org = await prisma.organization.create({ data: { name, description, logoUrl, website, city, state, zipCode, ageDivisions: ageDivisions || [], seasons: seasons || [], sports: sports || [], adminId: req.user!.userId } });
  res.status(201).json(org);
});

router.put('/:id', authenticate, requireRole('ORG_ADMIN'), async (req: Request, res: Response) => {
  const { name, description, logoUrl, website, city, state, zipCode, ageDivisions, seasons, sports } = req.body;
  const org = await prisma.organization.updateMany({ where: { id: req.params.id as string, adminId: req.user!.userId }, data: { name, description, logoUrl, website, city, state, zipCode, ageDivisions, seasons, sports } });
  if (org.count === 0) { res.status(404).json({ error: 'Not found or unauthorized' }); return; }
  res.json({ success: true });
});

router.delete('/:id', authenticate, requireRole('ORG_ADMIN'), async (req: Request, res: Response) => {
  await prisma.organization.deleteMany({ where: { id: req.params.id as string, adminId: req.user!.userId } });
  res.json({ success: true });
});

export default router;
