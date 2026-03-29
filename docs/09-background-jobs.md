# Background Jobs

## Overview

Campusphere uses BullMQ with Redis for automated background tasks. Three recurring jobs handle fee overdue detection, gate pass expiry, and notification cleanup.

## Job Queues

### 1. Fee Overdue Checker
- **Queue**: `fee-checks`
- **Schedule**: Daily at midnight (`0 0 * * *`)
- **Function**: Finds all fee records with status `PENDING` where `dueDate` has passed, and updates them to `OVERDUE`
- **Impact**: Students and admins see accurate fee statuses without manual intervention

### 2. Gate Pass Expiry
- **Queue**: `gate-pass-checks`
- **Schedule**: Every 6 hours (`0 */6 * * *`)
- **Function**: Finds all gate passes with status `APPROVED` or `CHECKED_OUT` where `expectedReturn` has passed, and marks them as `EXPIRED`
- **Impact**: Expired passes are automatically flagged for admin review

### 3. Notification Cleanup
- **Queue**: `notification-cleanup`
- **Schedule**: Weekly on Sunday at 2 AM (`0 2 * * 0`)
- **Function**: Deletes all read notifications older than 30 days
- **Impact**: Keeps the notifications table lean and query performance fast

## Architecture

```
┌─────────────┐     ┌───────────┐     ┌─────────────┐
│   Server     │────>│   Redis   │<────│   Workers   │
│ (setupQueues)│     │  (BullMQ) │     │ (setupWork) │
│  adds jobs   │     │  stores   │     │ processes   │
│  with cron   │     │  queue    │     │ jobs        │
└─────────────┘     └───────────┘     └─────────────┘
```

## Configuration

Jobs are initialized on server startup in `server.ts`:
```typescript
setupQueues();  // Registers recurring job schedules
setupWorkers(); // Starts job processors
```

Requires Redis to be running (configured via `REDIS_URL` env var).

## Files

| File | Purpose |
|------|---------|
| `apps/backend/src/jobs/queue.ts` | Queue definitions and schedule registration |
| `apps/backend/src/jobs/workers.ts` | Worker processors for each job type |
