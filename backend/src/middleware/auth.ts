import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

// Admin emails that can bypass role restrictions.
// Configurable via ADMIN_EMAILS env var (comma-separated). Falls back to seed list.
const FALLBACK_ADMINS = ['adamlloyd@msn.com', 'adam@mojumedia.com', 'josh@augmentadvertise.com', 'donald@augmentadvertise.com'];
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || FALLBACK_ADMINS.join(','))
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & { isAdmin?: boolean };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { ...payload, isAdmin: ADMIN_EMAILS.includes(payload.email?.toLowerCase()) };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    // Admins bypass role checks
    if (req.user.isAdmin) {
      next();
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
