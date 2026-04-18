import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

export async function isTeamMember(userId: string, teamId: string): Promise<boolean> {
  const member = await prisma.teamMember.findFirst({ where: { teamId, userId }, select: { id: true } });
  return !!member;
}

export async function isTeamCoach(userId: string, teamId: string): Promise<boolean> {
  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId, role: 'COACH' },
    select: { id: true },
  });
  return !!member;
}

export async function isOrgAdmin(userId: string, organizationId: string): Promise<boolean> {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId, adminId: userId },
    select: { id: true },
  });
  return !!org;
}

export function requireTeamMember(paramName = 'id') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.user?.isAdmin) return next();
    const teamId = req.params[paramName] as string | undefined;
    if (!teamId) { res.status(400).json({ error: 'Team id required' }); return; }
    if (await isTeamMember(req.user!.userId, teamId)) return next();
    res.status(403).json({ error: 'Not a member of this team' });
  };
}

export function requireTeamCoach(paramName = 'id') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.user?.isAdmin) return next();
    const teamId = req.params[paramName] as string | undefined;
    if (!teamId) { res.status(400).json({ error: 'Team id required' }); return; }
    if (await isTeamCoach(req.user!.userId, teamId)) return next();
    res.status(403).json({ error: 'Coach access required' });
  };
}
