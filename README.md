# Elev8 Sports 🏀⚡

A modern youth sports platform for teams, parents, coaches, and organizations.

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

## Project Structure
See [Architecture Docs](./docs/ARCHITECTURE.md) and [Build Plan](./docs/BUILD-PLAN.md).

## License
Private — Moju Media
