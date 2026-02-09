import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
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
import { errorHandler } from './middleware/errorHandler';

export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.get('/api/health', (_req, res) => { res.json({ status: 'ok', timestamp: new Date().toISOString() }); });
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/children', childRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/rsvps', rsvpRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🏀 Elev8 Sports API running on port ${PORT}`);
});
