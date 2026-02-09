import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (_req: Request, res: Response) => {
  const orgs = await prisma.organization.findMany({ include: { admin: { select: { firstName: true, lastName: true } }, _count: { select: { teams: true } } } });
  res.json(orgs);
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  const org = await prisma.organization.findUnique({ where: { id: req.params.id as string }, include: { teams: true, admin: { select: { firstName: true, lastName: true, email: true } } } });
  if (!org) { res.status(404).json({ error: 'Not found' }); return; }
  res.json(org);
});

router.post('/', authenticate, requireRole('ORG_ADMIN'), async (req: Request, res: Response) => {
  const { name, description, logoUrl, website } = req.body;
  const org = await prisma.organization.create({ data: { name, description, logoUrl, website, adminId: req.user!.userId } });
  res.status(201).json(org);
});

router.put('/:id', authenticate, requireRole('ORG_ADMIN'), async (req: Request, res: Response) => {
  const { name, description, logoUrl, website } = req.body;
  const org = await prisma.organization.updateMany({ where: { id: req.params.id as string, adminId: req.user!.userId }, data: { name, description, logoUrl, website } });
  if (org.count === 0) { res.status(404).json({ error: 'Not found or unauthorized' }); return; }
  res.json({ success: true });
});

router.delete('/:id', authenticate, requireRole('ORG_ADMIN'), async (req: Request, res: Response) => {
  await prisma.organization.deleteMany({ where: { id: req.params.id as string, adminId: req.user!.userId } });
  res.json({ success: true });
});

export default router;
