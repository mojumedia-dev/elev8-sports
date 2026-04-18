import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, avatarUrl: true, city: true, state: true, zipCode: true, createdAt: true },
  });
  res.json(user);
});

router.put('/me', authenticate, async (req: Request, res: Response) => {
  const { firstName, lastName, phone, avatarUrl, city, state, zipCode } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { firstName, lastName, phone, avatarUrl, city, state, zipCode },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, avatarUrl: true, city: true, state: true, zipCode: true },
  });
  res.json(user);
});

router.get('/', authenticate, requireRole('ORG_ADMIN'), async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true, city: true, state: true, zipCode: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

// Nearby players (children) for org admins — match by city/zip of parent against admin's orgs.
// Optionally filter by sport ∈ org sports.
router.get('/nearby-players', authenticate, requireRole('ORG_ADMIN'), async (req: Request, res: Response) => {
  const adminOrgs = await prisma.organization.findMany({
    where: { adminId: req.user!.userId },
    select: { city: true, state: true, zipCode: true, sports: true },
  });
  if (adminOrgs.length === 0) { res.json([]); return; }

  const cities = adminOrgs.map(o => o.city).filter((c): c is string => !!c);
  const zips = adminOrgs.map(o => o.zipCode).filter((z): z is string => !!z);
  const allSports = [...new Set(adminOrgs.flatMap(o => o.sports))];

  const parentFilters: any[] = [];
  if (cities.length > 0) parentFilters.push({ city: { in: cities, mode: 'insensitive' } });
  if (zips.length > 0) parentFilters.push({ zipCode: { in: zips } });
  if (parentFilters.length === 0) { res.json([]); return; }

  const where: any = { parent: { OR: parentFilters } };
  if (allSports.length > 0) {
    where.OR = [{ sport: { in: allSports } }, { sport: null }];
  }

  const children = await prisma.child.findMany({
    where,
    select: {
      id: true, firstName: true, lastName: true, sport: true, positions: true, dateOfBirth: true,
      parent: { select: { city: true, state: true, zipCode: true, firstName: true, lastName: true } },
      teamMembers: { select: { team: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(children);
});

export default router;
