# Elev8 Sports — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTS                           │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ React Web    │  │ React Native │  │ Admin     │ │
│  │ (Vite+TW)   │  │ (Future)     │  │ Portal    │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
└─────────┼──────────────────┼────────────────┼───────┘
          │                  │                │
          ▼                  ▼                ▼
┌─────────────────────────────────────────────────────┐
│                 REST API (Express)                   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐ │
│  │ Auth   │ │ Users  │ │ Teams  │ │ Events/RSVP  │ │
│  │ Routes │ │ Routes │ │ Routes │ │ Routes       │ │
│  └────────┘ └────────┘ └────────┘ └──────────────┘ │
│  ┌────────┐ ┌────────┐ ┌──────────────────────────┐ │
│  │ Orgs   │ │ Msgs   │ │ Notifications            │ │
│  │ Routes │ │ Routes │ │ Routes                   │ │
│  └────────┘ └────────┘ └──────────────────────────┘ │
│                                                      │
│  Middleware: JWT Auth │ Role Guard │ Validation       │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Prisma ORM                              │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL Database                     │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, React Router |
| Backend    | Node.js, Express, TypeScript        |
| ORM        | Prisma                              |
| Database   | PostgreSQL                          |
| Auth       | JWT (access + refresh tokens)       |
| Deploy     | Vercel (frontend), Railway (backend)|

## Folder Structure

```
elev8-sports/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/      # Auth, role guard, error handler
│   │   ├── routes/          # Express route definitions
│   │   ├── utils/           # JWT helpers, validation
│   │   └── index.ts         # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context (Auth, etc.)
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Route-level pages
│   │   ├── utils/           # API client, helpers
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docs/
│   ├── ARCHITECTURE.md
│   └── BUILD-PLAN.md
├── package.json
└── README.md
```

## Key Decisions

1. **Monorepo** — single repo, separate package.json per app
2. **REST over GraphQL** — simpler for MVP, less overhead
3. **Prisma** — type-safe DB access, easy migrations
4. **JWT** — stateless auth with access/refresh token pattern
5. **Vite** — fast builds, great DX
6. **Tailwind** — rapid UI development with utility classes
7. **Role-based access** — parent, coach, org_admin roles from day one
