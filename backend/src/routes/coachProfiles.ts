import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

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
  const { bio, sports, specialties, hourlyRate, yearsExperience, certifications, city, state, zipCode, contactEmail, contactPhone, acceptingClients } = req.body;
  const data: any = {
    bio, sports: sports || [], specialties: specialties || [],
    hourlyRate: hourlyRate ? Number(hourlyRate) : null,
    yearsExperience: yearsExperience ? Number(yearsExperience) : null,
    certifications: certifications || [],
    city, state, zipCode, contactEmail, contactPhone,
    acceptingClients: acceptingClients !== undefined ? !!acceptingClients : true,
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
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
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
