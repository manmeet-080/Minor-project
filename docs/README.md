# Campusphere Documentation

Complete documentation for the Campusphere Smart Campus Management Platform.

## Table of Contents

| # | Document | Description |
|---|----------|-------------|
| 01 | [Authentication](./01-authentication.md) | JWT auth, RBAC, login flow, password recovery, session management |
| 02 | [Student Module](./02-student-module.md) | Student portal — fees, complaints, mess, gate pass, attendance, events, emergency |
| 03 | [Admin Module](./03-admin-module.md) | Admin panel — dashboard, analytics, student/room/fee management, settings |
| 04 | [Staff Module](./04-staff-module.md) | Staff portal — complaint handling, attendance marking, visitor management |
| 05 | [Payment Gateway](./05-payment-gateway.md) | Razorpay integration — payment flow, security, configuration |
| 06 | [Real-time Notifications](./06-real-time-notifications.md) | Socket.io events, push notifications, event types |
| 07 | [Emergency & SOS](./07-emergency-sos.md) | Panic button, emergency contacts, safety instructions, rate limiting |
| 08 | [Event Management](./08-event-management.md) | Events, RSVP system, categories, admin/student views |
| 09 | [Background Jobs](./09-background-jobs.md) | BullMQ jobs — overdue fees, expired passes, notification cleanup |
| 10 | [Data Visualization](./10-data-visualization.md) | 10 chart components — area, bar, donut, radar, heatmap, sparkline, etc. |
| 11 | [API Reference](./11-api-reference.md) | Complete API docs — 79 endpoints across 15 modules |

## Quick Stats

| Metric | Count |
|--------|-------|
| API Endpoints | 79 |
| Backend Modules | 15 |
| Frontend Pages | 29 |
| Database Models | 18 |
| Chart Components | 10 |
| User Roles | 5 |
| Socket.io Events | 7 |
| Background Jobs | 3 |

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, Shadcn/ui, Recharts, Zustand, Socket.io Client
- **Backend**: Express.js, TypeScript, Prisma ORM, PostgreSQL 16, Redis 7, Socket.io, BullMQ
- **Payments**: Razorpay
- **Infrastructure**: Docker Compose, Turborepo, pnpm
