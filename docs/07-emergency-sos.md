# Emergency & SOS System

## Overview

Campusphere includes a comprehensive emergency system for student safety. Students have access to emergency contacts, safety instructions, and a panic button that instantly alerts all hostel management.

## Emergency Page (`/student/emergency`)

### Emergency Contacts
Quick-dial cards for:
| Service | Number |
|---------|--------|
| Police | 112 |
| Ambulance | 108 |
| Fire Brigade | 101 |
| Campus Security | 1800-XXX-XXXX |

Tapping any card opens the phone dialer.

### Safety Instructions
Step-by-step instructions for 4 emergency scenarios:
1. **Fire Emergency** — alarm, evacuate via stairs, crawl, assemble, call 101
2. **Medical Emergency** — don't move injured, call 108, first aid, notify warden
3. **Security Threat** — safe location, lock doors, don't confront, call 112, use panic button
4. **Natural Disaster** — drop/cover/hold, avoid windows, follow staff, don't re-enter

### Panic Button
- Large red button with confirmation dialog
- On confirm:
  1. Sends `POST /api/v1/notifications/sos` to backend
  2. Backend creates WARNING notifications for all ADMIN/WARDEN/SUPER_ADMIN in the hostel
  3. Real-time Socket.io broadcast to entire hostel
  4. After API call completes, initiates phone call to 112
  5. Shows "Alert Sent" confirmation with timestamp

## Rate Limiting

The SOS endpoint is rate-limited to **3 requests per 15 minutes** per user via Redis-based rate limiter. This prevents accidental floods while still allowing multiple alerts in a genuine emergency.

## SOS Alert Details

When triggered, the backend collects:
- Student's name and roll number
- Student's room location (Block + Room Number)
- Timestamp

The alert message format:
```
EMERGENCY SOS ALERT
Emergency SOS triggered by Arun Kumar (CS2024001) at Block A - Room A101
```

## Floating SOS Button

In addition to the dedicated page, a floating red phone button appears on every student page (bottom-right corner). This also triggers the SOS API and phone call for quick access.

## API

| Method | Endpoint | Rate Limit | Description |
|--------|----------|------------|-------------|
| `POST` | `/api/v1/notifications/sos` | 3 per 15min | Send SOS alert to all hostel management |
