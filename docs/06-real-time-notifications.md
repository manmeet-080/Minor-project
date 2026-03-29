# Real-time Notifications

## Overview

Campusphere uses Socket.io for real-time push notifications. When events occur (new complaint, gate pass approval, fee payment, etc.), all relevant users receive instant toast notifications without page refresh.

## Architecture

```
┌──────────────────┐                    ┌──────────────────┐
│   Frontend App   │◄───── Socket ─────►│   Backend Server │
│                  │    (WebSocket)      │                  │
│  useSocket()     │                    │  Socket.io Server │
│  useSocketEvent()│                    │                  │
│  NotificationCtr │                    │  events.ts        │
│                  │                    │  (emit helpers)   │
└──────────────────┘                    └──────────────────┘
```

## Socket Rooms

When a user connects, they automatically join:
- `user:{userId}` — for personal notifications
- `hostel:{hostelId}` — for hostel-wide broadcasts

## Event Types

| Event | Audience | Trigger | Payload |
|-------|----------|---------|---------|
| `notification:broadcast` | Hostel | Admin sends announcement | `{ title, message }` |
| `complaint:new` | Hostel | Student files complaint | `{ id, title, category, priority }` |
| `complaint:statusChanged` | Student + Hostel | Status updated | `{ id, title, status }` |
| `gatePass:decision` | Student | Pass approved/rejected | `{ id, status, type }` |
| `fee:paymentRecorded` | Hostel | Student pays online | `{ id, studentId, amount, status }` |
| `visitor:entry` | Student | Visitor arrives for student | `{ id, visitorName, purpose }` |

## Frontend Integration

### NotificationCenter Component
Located in the top bar across all pages. Listens to all socket events and:
1. Invalidates the `['notifications']` React Query cache (refreshes notification list)
2. Shows a Sonner toast with event-specific message
3. Falls back to polling (60s interval) if socket disconnects

### Hooks
```typescript
// Connect to socket with JWT auth
const socket = useSocket();

// Listen to specific events
useSocketEvent('complaint:new', (data) => {
  toast.info('New Complaint', { description: data.title });
});
```

## Backend Integration

Services emit events after database mutations:

```typescript
// In complaints.service.ts after creating a complaint:
events.newComplaint(hostelId, { id, title, category, priority });

// In notifications.service.ts after broadcast:
events.broadcastNotification(hostelId, { title, message });
```

## Authentication

Socket connections require a valid JWT token:
```typescript
const socket = io(SOCKET_URL, {
  auth: { token: accessToken },
});
```
The server validates the token before allowing the connection.
