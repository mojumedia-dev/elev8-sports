import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

const orgSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(3000).optional().nullable(),
  logoUrl: z.string().trim().max(500).optional().nullable(),
  website: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  state: z.string().trim().max(2).optional().nullable(),
  zipCode: z.string().trim().max(10).optional().nullable(),
  ageDivisions: z.array(z.string().max(40)).max(50).optional(),
  seasons: z.array(z.string().max(40)).max(50).optional(),
  sports: z.array(z.string().max(40)).max(20).optional(),
});

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
  const parsed = orgSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const d = parsed.data;
  const org = await prisma.organization.create({
    data: {
      name: d.name, description: d.description ?? undefined, logoUrl: d.logoUrl ?? undefined,
      website: d.website ?? undefined, city: d.city ?? undefined, state: d.state ?? undefined, zipCode: d.zipCode ?? undefined,
      ageDivisions: d.ageDivisions ?? [], seasons: d.seasons ?? [], sports: (d.sports as any) ?? [],
      adminId: req.user!.userId,
    },
  });
  res.status(201).json(org);
});

router.put('/:id', authenticate, requireRole('ORG_ADMIN'), async (req: Request, res: Response) => {
  const parsed = orgSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const d = parsed.data;
  const where = req.user!.isAdmin
    ? { id: req.params.id as string }
    : { id: req.params.id as string, adminId: req.user!.userId };
  const org = await prisma.organization.updateMany({
    where,
    data: {
      name: d.name, description: d.description ?? undefined, logoUrl: d.logoUrl ?? undefined,
      website: d.website ?? undefined, city: d.city ?? undefined, state: d.state ?? undefined, zipCode: d.zipCode ?? undefined,
      ageDivisions: d.ageDivisions, seasons: d.seasons, sports: d.sports as any,
    },
  });
  if (org.count === 0) { res.status(404).json({ error: 'Not found or unauthorized' }); return; }
  res.json({ success: true });
});

router.delete('/:id', authenticate, requireRole('ORG_ADMIN'), async (req: Request, res: Response) => {
  await prisma.organization.deleteMany({ where: { id: req.params.id as string, adminId: req.user!.userId } });
  res.json({ success: true });
});

export default router;
