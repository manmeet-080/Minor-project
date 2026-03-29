# Event Management

## Overview

The event management system allows hostel admins to create and manage events, and students to browse and RSVP. Supports multiple event categories, capacity tracking, and RSVP status management.

## Features

### Admin Side (`/admin/events`)
- **Create events** with:
  - Title, description, venue
  - Start date/time and optional end date
  - Capacity limit (optional)
  - Category selection
  - Event image URL (optional)
- **View events** in a card grid with RSVP counts
- **Delete events** (soft delete with confirmation)

### Student Side (`/student/events`)
- **Browse events** in a card grid
- **Filter by category**: General, Cultural, Sports, Academic, Festival, Meeting
- **RSVP** with three options:
  - Going (green)
  - Maybe (amber)
  - Can't Go (removes RSVP)
- See RSVP count vs capacity

## Event Categories

| Category | Color | Use Case |
|----------|-------|----------|
| General | Gray | General announcements, meetups |
| Cultural | Purple | Cultural fests, performances |
| Sports | Green | Sports events, tournaments |
| Academic | Blue | Workshops, seminars, study groups |
| Festival | Amber | Holiday celebrations, festivals |
| Meeting | Rose | Hostel meetings, town halls |

## RSVP System

- Each user can have one RSVP per event (enforced by unique constraint)
- RSVP statuses: `GOING`, `MAYBE`, `NOT_GOING`
- Selecting "Can't Go" removes the RSVP record entirely
- RSVP counts are calculated server-side

## Database Schema

### Event
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | String | Event name |
| `description` | String | Event details |
| `venue` | String | Location |
| `date` | DateTime | Start date and time |
| `endDate` | DateTime? | Optional end date |
| `capacity` | Int? | Max attendees |
| `imageUrl` | String? | Event image |
| `category` | Enum | Event category |
| `hostelId` | FK | Associated hostel |
| `createdById` | FK | Admin who created it |
| `isActive` | Boolean | Soft delete flag |

### EventRsvp
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `eventId` | FK | Event reference |
| `userId` | FK | User who RSVP'd |
| `status` | Enum | GOING, MAYBE, NOT_GOING |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/events` | Yes | List events (filter: hostelId, category, upcoming) |
| `GET` | `/api/v1/events/:id` | Yes | Get event details with RSVP list and user's RSVP status |
| `POST` | `/api/v1/events` | Admin/Warden | Create event |
| `PATCH` | `/api/v1/events/:id` | Admin/Warden | Update event |
| `DELETE` | `/api/v1/events/:id` | Admin/Warden | Soft delete event |
| `POST` | `/api/v1/events/:id/rsvp` | Yes | Submit RSVP (body: `{ status }`) |
