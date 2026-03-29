<div align="center">

# 🏠 Campusphere — Smart Campus Management Platform

A full-stack campus and hostel management platform for educational institutions — handling everything from room allocation and fee tracking to gate passes, mess menus, and complaint resolution.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Tech Stack

<div align="center">

### Frontend

[![Frontend Stack](https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,vercel)](https://skillicons.dev)

| Technology | Purpose |
|:--|:--|
| **Next.js 15** (Turbopack) | React framework with App Router |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **Shadcn/ui** + Radix UI | Component library |
| **TanStack Query** | Server state management |
| **TanStack Table** | Data tables with sorting, filtering, pagination |
| **Zustand** | Client state management |
| **React Hook Form** + Zod | Form handling & validation |
| **Recharts** | Data visualization & charts |
| **Framer Motion** | Animations |
| **Socket.io Client** | Real-time updates |
| **Lucide React** | Icons |
| **Sonner** | Toast notifications |

### Backend

[![Backend Stack](https://skillicons.dev/icons?i=nodejs,express,ts,postgres,redis,prisma,docker)](https://skillicons.dev)

| Technology | Purpose |
|:--|:--|
| **Express.js** | REST API framework |
| **TypeScript** | Type safety |
| **Prisma** | ORM with 16 models |
| **PostgreSQL 16** | Primary database |
| **Redis 7** | Caching, token blacklist, sessions |
| **Socket.io** | Real-time WebSocket events |
| **BullMQ** | Background job queue |
| **JWT** + bcryptjs | Authentication & password hashing |
| **Zod** | Request validation |
| **Nodemailer** | Email notifications |
| **Cloudinary** | Image uploads & CDN |
| **Helmet** | HTTP security headers |

### DevOps & Tooling

[![DevOps Stack](https://skillicons.dev/icons?i=docker,pnpm,turborepo,git)](https://skillicons.dev)

| Technology | Purpose |
|:--|:--|
| **Turborepo** | Monorepo build orchestration |
| **pnpm** | Fast, disk-efficient package manager |
| **Docker Compose** | Local dev infrastructure |
| **ESLint** | Code linting |

</div>

---

## Features

### 🎓 Student Portal
- **Dashboard** — overview of room, fees, complaints, and announcements
- **Room Details** — view assigned room, bed, block info
- **Fee Management** — view dues, payment history, receipts
- **Complaints** — submit and track complaints with priority levels
- **Mess Menu** — weekly menu and meal booking
- **Gate Pass** — request and track gate passes
- **Profile** — manage personal info and parent contact details

### 🛡️ Admin Panel
- **Dashboard** — analytics, occupancy stats, revenue charts
- **Student Management** — enrollment approvals, profiles, checkout
- **Room Management** — allocation, status tracking, capacity planning
- **Complaint Management** — assign staff, update status, resolution tracking
- **Fee Management** — create fee records, track payments, issue waivers
- **Mess Management** — menu planning, meal bookings
- **Gate Pass Approvals** — approve/reject student gate passes
- **Visitor Log** — entry/exit logging with identification
- **Reports** — hostel analytics, occupancy, revenue reports
- **Settings** — general, team, notifications, billing, security

### 👷 Staff Portal
- **Dashboard** — assigned complaints and tasks
- **Complaint Tracking** — view and update assigned complaints
- **Visitor Management** — log visitor entries and exits

### 🔐 Auth & Security
- JWT access + refresh tokens with Redis blacklist
- Role-based access control (RBAC) — 5 roles
- Login history audit trail
- Password hashing with bcryptjs
- HTTP security headers (Helmet)
- CORS configuration

### 🔔 Real-time
- WebSocket notifications via Socket.io
- In-app notification center with read/unread tracking
- Broadcast announcements to hostel residents

---

## Project Structure

```
campusphere/
├── apps/
│   ├── backend/                # Express API
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # 16 models, 16 enums
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── config/         # Database, Redis, environment
│   │       ├── modules/        # 12 feature modules
│   │       │   ├── auth/
│   │       │   ├── students/
│   │       │   ├── rooms/
│   │       │   ├── complaints/
│   │       │   ├── fees/
│   │       │   ├── mess/
│   │       │   ├── gate-pass/
│   │       │   ├── visitors/
│   │       │   ├── notifications/
│   │       │   ├── reports/
│   │       │   ├── users/
│   │       │   └── hostels/
│   │       ├── shared/         # Middleware, utils
│   │       ├── sockets/        # Socket.io handlers
│   │       └── jobs/           # BullMQ workers
│   │
│   └── frontend/               # Next.js App
│       └── src/
│           ├── app/
│           │   ├── (auth)/     # Login, password reset
│           │   ├── (admin)/    # 12 admin pages
│           │   ├── (student)/  # 7 student pages
│           │   └── (staff)/    # 3 staff pages
│           ├── components/
│           │   ├── ui/         # Shadcn components
│           │   ├── shared/     # DataTable, Sidebar, etc.
│           │   └── charts/     # Recharts wrappers
│           ├── lib/api/        # Axios client
│           ├── hooks/          # Custom hooks
│           ├── stores/         # Zustand stores
│           └── providers/      # Query, Theme providers
│
├── packages/
│   └── types/                  # Shared TypeScript types
│
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 10
- **Docker** & Docker Compose

### 1. Clone & Install

```bash
git clone https://github.com/your-username/campusphere.git
cd campusphere
pnpm install
```

### 2. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on `localhost:5432`
- **Redis 7** on `localhost:6379`

### 3. Configure Environment

```bash
cp apps/backend/.env.example apps/backend/.env
```

Default `.env` values work out of the box with Docker Compose:

```env
DATABASE_URL="postgresql://campusphere:campusphere_dev_password@localhost:5432/campusphere?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="campusphere-dev-jwt-secret-change-in-production"
PORT=4000
CORS_ORIGIN="http://localhost:3000"
```

### 4. Setup Database

```bash
# Run migrations
cd apps/backend && npx prisma migrate dev

# Seed test data
npx prisma db seed
```

### 5. Start Development

```bash
# From the root — starts both frontend & backend
pnpm dev
```

| Service | URL |
|:--|:--|
| Frontend | [http://localhost:3000](http://localhost:3000) |
| Backend API | [http://localhost:4000](http://localhost:4000) |
| Prisma Studio | Run `npx prisma studio` → [http://localhost:5555](http://localhost:5555) |

### Test Accounts

| Role | Email | Password |
|:--|:--|:--|
| Admin | `admin@campusphere.edu` | `admin123` |
| Warden | `warden@campusphere.edu` | `warden123` |
| Staff | `staff@campusphere.edu` | `staff123` |

---

## Commands

| Command | Description |
|:--|:--|
| `pnpm dev` | Start all apps in dev mode (Turborepo) |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all apps |
| `docker compose up -d` | Start PostgreSQL & Redis |
| `docker compose down` | Stop infrastructure |
| `cd apps/backend && npx prisma migrate dev` | Run database migrations |
| `cd apps/backend && npx prisma db seed` | Seed database with test data |
| `cd apps/backend && npx prisma studio` | Open database GUI |
| `cd apps/backend && npx prisma generate` | Regenerate Prisma client |

---

## Database Schema

16 models across the following domains:

| Model | Description |
|:--|:--|
| `User` | Core user with role-based access |
| `StudentProfile` | Student details — roll number, department, year, parent info |
| `Hostel` | Facility with warden assignment |
| `Block` | Building blocks within hostels |
| `Room` | Rooms with type (Single/Double/Triple/Dorm) and status |
| `Bed` | Individual beds with occupancy tracking |
| `Complaint` | Issue tracking with priority and category |
| `ComplaintUpdate` | Status change and comment history |
| `FeeRecord` | Payment records with transaction details |
| `MessMenu` | Weekly meal planning by day and type |
| `MessBooking` | Student meal bookings with feedback |
| `GatePass` | Exit passes with approval workflow |
| `Visitor` | Visitor entry/exit logging |
| `Notification` | In-app notifications with read tracking |
| `LoginHistory` | Security audit trail |
| `AuditLog` | Entity-level change tracking |

---

## API

A complete Postman collection with **67 API requests** is included:

```
shms-api.postman_collection.json
```

Import it into [Postman](https://www.postman.com/) to test all endpoints.

---

## License

MIT
