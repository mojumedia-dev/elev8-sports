import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate } from '../middleware/auth';

const router = Router();

const VALID_TYPES = ['TEAM', 'ORGANIZATION', 'COACH'] as const;
type TargetType = (typeof VALID_TYPES)[number];

// Get reviews for a target
router.get('/:targetType/:targetId', authenticate, async (req: Request, res: Response) => {
  const targetType = (req.params.targetType as string).toUpperCase() as TargetType;
  if (!VALID_TYPES.includes(targetType)) { res.status(400).json({ error: 'Invalid target type' }); return; }

  const reviews = await prisma.review.findMany({
    where: { targetType, targetId: req.params.targetId as string },
    include: { reviewer: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  res.json({ reviews, avg, count: reviews.length });
});

// Create or update my review
router.post('/:targetType/:targetId', authenticate, async (req: Request, res: Response) => {
  const targetType = (req.params.targetType as string).toUpperCase() as TargetType;
  if (!VALID_TYPES.includes(targetType)) { res.status(400).json({ error: 'Invalid target type' }); return; }

  const { rating, comment } = req.body;
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) { res.status(400).json({ error: 'Rating must be integer 1-5' }); return; }
  if (comment && typeof comment !== 'string') { res.status(400).json({ error: 'Invalid comment' }); return; }
  const safeComment = comment ? String(comment).slice(0, 2000) : null;

  const review = await prisma.review.upsert({
    where: { reviewerId_targetType_targetId: { reviewerId: req.user!.userId, targetType, targetId: req.params.targetId as string } },
    update: { rating: r, comment: safeComment },
    create: { reviewerId: req.user!.userId, targetType, targetId: req.params.targetId as string, rating: r, comment: safeComment },
  });
  res.status(201).json(review);
});

// Delete my review
router.delete('/:targetType/:targetId', authenticate, async (req: Request, res: Response) => {
  const targetType = (req.params.targetType as string).toUpperCase() as TargetType;
  if (!VALID_TYPES.includes(targetType)) { res.status(400).json({ error: 'Invalid target type' }); return; }

  await prisma.review.deleteMany({
    where: { reviewerId: req.user!.userId, targetType, targetId: req.params.targetId as string },
  });
  res.json({ success: true });
});

// Summaries for a list of targets — POST body: { targetType, targetIds: string[] }
router.post('/summaries', authenticate, async (req: Request, res: Response) => {
  const targetType = String(req.body.targetType || '').toUpperCase() as TargetType;
  if (!VALID_TYPES.includes(targetType)) { res.status(400).json({ error: 'Invalid target type' }); return; }
  const ids: string[] = Array.isArray(req.body.targetIds) ? req.body.targetIds.filter((x: any) => typeof x === 'string') : [];
  if (ids.length === 0) { res.json({}); return; }

  const groups = await prisma.review.groupBy({
    by: ['targetId'],
    where: { targetType, targetId: { in: ids } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const map = Object.fromEntries(groups.map(g => [g.targetId, { avg: g._avg.rating, count: g._count.rating }]));
  res.json(map);
});

export default router;
