A modern, role-based esports management dashboard built for teams, managers, and players.

## Overview

NOCTIS X KING is a web-based management platform designed for esports organizations. It provides a centralized system for overseeing teams, rosters, tournaments, and player activity — all under a single role-based authentication flow.

---

## Features

- **Multi-role dashboard** — Separate views and permissions for Super Admin, Team Manager, Staff, and Player
- **Team management** — Roster handling, match scheduling, and tournament tracking
- **Player dashboard** — Personal stats, match history, and activity log
- **Analytics** — Performance charts powered by Recharts
- **Audit log** — Full activity tracking for administrative oversight
- **Reusable UI system** — Modular components including modal, toast, badge, KPI card, and data table

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6 |
| Styling | Tailwind CSS v3 |
| Backend / Database | Supabase (Auth + PostgreSQL) |
| Charts | Recharts |
| Icons | Lucide React |
| Build Tool | Vite 5 |
| Deployment | Vercel |

---

## Getting Started

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start development server
npm run dev
```

See `.env.example` for required environment variables.

---

## Project Structure

```
src/
├── App.jsx
├── main.jsx
├── index.css
├── lib/
│   ├── supabase.js
│   └── scraper.js
├── hooks/
│   ├── useAuth.js
│   ├── useRole.js
│   └── useToast.js
├── router/
│   └── ProtectedRoute.jsx
├── components/
│   ├── layout/
│   ├── ui/
│   └── super-admin/
└── pages/
    ├── auth/
    └── dashboard/
        ├── super-admin/
        ├── team-manager/
        └── player/
```

---

## Roles

| Role | Access |
|---|---|
| `super_admin` | Full control — teams, users, audit log, and global settings |
| `team_manager` | Manage roster, matches, and tournaments for their own team |
| `staff` | Operational support within team manager scope |
| `player` | Personal stats, match history, and tournament schedule |

---

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

---

## License

© NOCTIS X KING Esports. All rights reserved.