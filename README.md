# Elev8 Sports 🏀⚡

A modern youth sports platform for teams, parents, coaches, and organizations.

**Elev8 Sports complements GameChanger — we don't replace your stat tracking, we enhance it.** Import your stats from GameChanger to build player profiles, track development, and connect your sports community.

## What Elev8 Does
- 🏟 **Team Management** — rosters, schedules, RSVPs, messaging
- 📊 **GameChanger Integration** — import CSV stats to build player profiles (baseball & softball)
- 👨‍👩‍👧‍👦 **Family Hub** — manage multiple children across multiple sports
- 🏢 **Organization Management** — leagues, clubs, multi-team admin
- 📅 **Scheduling** — practices, games, tryouts with RSVP tracking
- 💬 **Team Messaging** — coach-to-parent and team-wide communication

## What Elev8 Does NOT Do
- ❌ Live stat tracking during games (that's GameChanger's job)
- ❌ Replace your existing tools — we integrate with them

## Supported Sports
- ⚾ Baseball
- 🥎 Softball
- 🏀 Basketball (coming soon)
- ⚽ Soccer (coming soon)
- 🏈 Flag Football (coming soon)

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT (access + refresh tokens)

## Getting Started

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Configure DATABASE_URL and JWT secrets
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## GameChanger Integration
See [GameChanger Integration Docs](./docs/GAMECHANGER-INTEGRATION.md) for details on how the import works.

## Project Structure
See [Architecture Docs](./docs/ARCHITECTURE.md) and [Build Plan](./docs/BUILD-PLAN.md).

## License
Private — Moju Media
