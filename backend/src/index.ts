import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import childRoutes from './routes/children';
import orgRoutes from './routes/organizations';
import teamRoutes from './routes/teams';
import eventRoutes from './routes/events';
import rsvpRoutes from './routes/rsvps';
import messageRoutes from './routes/messages';
import notificationRoutes from './routes/notifications';
import gamechangerRoutes from './routes/gamechanger';
import announcementRoutes from './routes/announcements';
import coachProfileRoutes from './routes/coachProfiles';
import reviewRoutes from './routes/reviews';
import { errorHandler } from './middleware/errorHandler';

export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  console.error('FATAL: FRONTEND_URL must be set in production');
  process.exit(1);
}

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '6mb' }));
app.set('trust proxy', 1);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again later' },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reset requests, please try again later' },
});

app.get('/api/health', (_req, res) => { res.json({ status: 'ok', timestamp: new Date().toISOString() }); });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/children', childRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/rsvps', rsvpRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/imports/gamechanger', gamechangerRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/coach-profiles', coachProfileRoutes);
app.use('/api/reviews', reviewRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🏀 Elev8 Sports API running on port ${PORT}`);
});
