import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

const coachProfileSchema = z.object({
  bio: z.string().trim().max(3000).optional().nullable(),
  sports: z.array(z.string().trim().max(40)).max(20).optional(),
  specialties: z.array(z.string().trim().max(80)).max(30).optional(),
  hourlyRate: z.union([z.number().min(0).max(10000), z.string()]).optional().nullable(),
  yearsExperience: z.union([z.number().int().min(0).max(80), z.string()]).optional().nullable(),
  certifications: z.array(z.string().trim().max(120)).max(30).optional(),
  city: z.string().trim().max(80).optional().nullable(),
  state: z.string().trim().max(2).optional().nullable(),
  zipCode: z.string().trim().max(10).optional().nullable(),
  contactEmail: z.string().trim().email().max(120).optional().nullable().or(z.literal('')),
  contactPhone: z.string().trim().max(40).optional().nullable(),
  acceptingClients: z.boolean().optional(),
});

// Browse coaches — defaults to nearby if user has location, with optional sport/specialty filters
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { sport, specialty, city, zipCode, nearby } = req.query as Record<string, string>;

  const where: any = { acceptingClients: true };

  if (nearby === 'true') {
    const me = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { city: true, zipCode: true } });
    const loc: any[] = [];
    if (me?.city) loc.push({ city: { equals: me.city, mode: 'insensitive' } });
    if (me?.zipCode) loc.push({ zipCode: me.zipCode });
    if (loc.length > 0) where.OR = loc;
  } else {
    if (city) where.city = { equals: city, mode: 'insensitive' };
    if (zipCode) where.zipCode = zipCode;
  }

  if (sport) where.sports = { has: sport };
  if (specialty) where.specialties = { has: specialty };

  const coaches = await prisma.coachProfile.findMany({
    where,
    include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  // Attach average rating
  const ids = coaches.map(c => c.id);
  const reviews = ids.length > 0 ? await prisma.review.groupBy({
    by: ['targetId'],
    where: { targetType: 'COACH', targetId: { in: ids } },
    _avg: { rating: true },
    _count: { rating: true },
  }) : [];
  const ratingMap = Object.fromEntries(reviews.map(r => [r.targetId, { avg: r._avg.rating, count: r._count.rating }]));

  res.json(coaches.map(c => ({ ...c, rating: ratingMap[c.id] || { avg: null, count: 0 } })));
});

// My coach profile
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const profile = await prisma.coachProfile.findUnique({ where: { userId: req.user!.userId } });
  res.json(profile);
});

// Upsert my coach profile
router.put('/me', authenticate, async (req: Request, res: Response) => {
  const parsed = coachProfileSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() }); return; }
  const p = parsed.data;
  const rate = p.hourlyRate === null || p.hourlyRate === undefined || p.hourlyRate === '' ? null : Math.max(0, Number(p.hourlyRate));
  const years = p.yearsExperience === null || p.yearsExperience === undefined || p.yearsExperience === '' ? null : Math.max(0, Math.floor(Number(p.yearsExperience)));
  const data: any = {
    bio: p.bio ?? undefined,
    sports: p.sports ?? [],
    specialties: p.specialties ?? [],
    hourlyRate: Number.isFinite(rate as number) ? rate : null,
    yearsExperience: Number.isFinite(years as number) ? years : null,
    certifications: p.certifications ?? [],
    city: p.city ?? undefined,
    state: p.state ?? undefined,
    zipCode: p.zipCode ?? undefined,
    contactEmail: p.contactEmail || null,
    contactPhone: p.contactPhone ?? undefined,
    acceptingClients: p.acceptingClients !== undefined ? !!p.acceptingClients : true,
  };
  const profile = await prisma.coachProfile.upsert({
    where: { userId: req.user!.userId },
    update: data,
    create: { ...data, userId: req.user!.userId },
  });
  res.json(profile);
});

// Delete my coach profile
router.delete('/me', authenticate, async (req: Request, res: Response) => {
  await prisma.coachProfile.deleteMany({ where: { userId: req.user!.userId } });
  res.json({ success: true });
});

// Single coach by id (with reviews)
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const profile = await prisma.coachProfile.findUnique({
    where: { id: req.params.id as string },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });
  if (!profile) { res.status(404).json({ error: 'Not found' }); return; }

  const reviews = await prisma.review.findMany({
    where: { targetType: 'COACH', targetId: profile.id },
    include: { reviewer: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  res.json({ ...profile, reviews, rating: { avg, count: reviews.length } });
});

export default router;
