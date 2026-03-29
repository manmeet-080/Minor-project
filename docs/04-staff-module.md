# Staff Module

## Overview

The staff module provides hostel staff members with tools to manage their assigned tasks — primarily complaint handling, attendance marking, and visitor management. Staff access their portal at `/staff/*` routes.

## Features

### 1. Task Dashboard
- Stat cards: Assigned Tasks, Resolved Today, Pending Visitors
- Recent assigned complaints list with priority and status badges
- Quick actions: View All Complaints, Manage Visitors

### 2. Complaint Handling
- View complaints assigned to the logged-in staff member
- Update complaint status with message:
  - OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
  - Can also REOPEN resolved complaints
- Each status change creates a `ComplaintUpdate` record for audit trail

### 3. Attendance Marking
- Select date and view all approved students
- **Per-student quick buttons**: Present, Absent, Late, On Leave (each icon marks that specific status)
- **Bulk mark**: Mark all unmarked students with a default status in one click
- Stats: Total students, Present, Absent, Unmarked for the selected date
- Daily attendance report with real-time updates

### 4. Visitor Management
- Log visitor entries with: name, phone, purpose, ID proof, student being visited
- Log visitor exits
- View visitor log table
- Student auto-complete for visitor association

## API Endpoints (Staff-accessible)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/complaints?assignedToId=` | List assigned complaints |
| `PATCH` | `/api/v1/complaints/:id/status` | Update complaint status |
| `POST` | `/api/v1/attendance` | Mark single student attendance |
| `POST` | `/api/v1/attendance/bulk` | Mark attendance for multiple students |
| `GET` | `/api/v1/attendance/daily/:hostelId` | Get daily attendance report |
| `GET` | `/api/v1/visitors` | List visitors |
| `POST` | `/api/v1/visitors` | Log visitor entry |
| `PATCH` | `/api/v1/visitors/:id/exit` | Log visitor exit |

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/staff/dashboard` | Task overview with stats and recent complaints |
| `/staff/complaints` | Assigned complaints management |
| `/staff/attendance` | Mark student attendance |
| `/staff/visitors` | Visitor entry/exit logging |
