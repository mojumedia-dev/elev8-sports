import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

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
