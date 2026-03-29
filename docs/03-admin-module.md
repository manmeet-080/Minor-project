# Admin / Warden Module

## Overview

The admin module provides hostel administrators and wardens with tools to manage students, rooms, fees, complaints, events, and view analytics. Admins access their panel at `/admin/*` routes.

## Features

### 1. Analytics Dashboard
- **Stat cards**: Total Students, Occupancy Rate (%), Monthly Revenue, Open Complaints — each with trend indicators
- **Revenue Trend Chart**: 6-month area chart showing collected vs charged amounts
- **Occupancy Progress Ring**: Visual percentage of beds filled
- **Complaints Donut Chart**: Status breakdown (Open, Assigned, In Progress, Resolved)
- **Room Occupancy Grid**: Color-coded grid of all rooms by status
- **Quick Actions**: Add Student, Record Payment, View Reports, Broadcast Notice
- **Recent Activity Feed**: Timeline of latest hostel activity

### 2. Student Management
- List all students with filters (status, search, sort)
- Approve or reject pending applications
- Transfer students between rooms/beds (atomic transaction — prevents race conditions)
- Checkout students (frees bed automatically)
- View detailed student profiles with fee and complaint history

### 3. Room & Bed Management
- View all rooms in a block-based occupancy grid
- Create new blocks, rooms, and beds
- Allocate beds to students
- Vacate beds
- Update room status (Available, Occupied, Under Maintenance)
- Room types: Single, Double, Triple, Dormitory

### 4. Fee Management
- Create fee records for students (Hostel Fee, Mess Fee, Maintenance, Security Deposit, Fine)
- Record manual payments (Cash, UPI, Bank Transfer, Card, Cheque)
- Waive fees with remarks
- View fee collection reports
- Razorpay payment verification (auto-records when student pays online)

### 5. Complaint Management
- **Kanban board view** — drag complaints across status columns
- **Table view** — sortable, searchable complaint list
- Assign complaints to staff members
- Update status with messages
- View complaint detail with update timeline
- Categories: Electrical, Plumbing, Furniture, Cleaning, Internet, Pest Control, Security, Maintenance

### 6. Mess Management
- Edit weekly menu (7 days x 4 meals) with inline editing
- View meal booking statistics
- Monthly consumption report
- Mess fee calculation per student

### 7. Gate Pass Approvals
- View all pending gate pass requests
- Approve or reject with remarks
- Track checkout and return status
- Stat cards: Total, Pending, Currently Out, Returned Today

### 8. Visitor Log
- View visitor entry/exit records
- Filter by date
- Stat cards: Today's Visitors, Currently Inside, Monthly Total

### 9. Event Management
- Create events with title, description, venue, date/time, capacity, category, image
- View events in card grid
- See RSVP counts per event
- Delete events
- Event categories: General, Cultural, Sports, Academic, Festival, Meeting

### 10. Broadcast Announcements
- Send announcements to all hostel residents
- Broadcast dialog accessible from dashboard quick actions
- Creates notification for every active user in the hostel
- Real-time delivery via Socket.io

### 11. Reports & Export
- **6 report types**: Occupancy, Fees, Complaints, Gate Passes, Visitors, Mess
- Date range picker for all reports
- Charts: Area, Bar, Donut, Radar, Horizontal Bar
- **CSV export** with properly escaped values
- **Print** functionality for PDF output

### 12. Settings
- **General**: Update hostel name, address, warden assignment
- **Team**: View team members, create new staff/admin accounts
- **Notifications**: Toggle notification preferences (persisted to localStorage)
- **Billing**: Usage overview (students, rooms, team count)
- **Security**: Change password, view active sessions, revoke all sessions

## API Endpoints (Admin-specific)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/students` | List all students |
| `POST` | `/api/v1/students/:id/approve` | Approve student |
| `POST` | `/api/v1/students/:id/reject` | Reject student |
| `POST` | `/api/v1/students/:id/transfer` | Transfer student to new bed |
| `POST` | `/api/v1/students/:id/checkout` | Checkout student |
| `POST` | `/api/v1/rooms` | Create room |
| `POST` | `/api/v1/rooms/allocate` | Allocate bed |
| `POST` | `/api/v1/rooms/blocks` | Create block |
| `POST` | `/api/v1/fees` | Create fee record |
| `PATCH` | `/api/v1/fees/:id/pay` | Record payment |
| `PATCH` | `/api/v1/fees/:id/waive` | Waive fee |
| `PATCH` | `/api/v1/complaints/:id/assign` | Assign complaint |
| `POST` | `/api/v1/events` | Create event |
| `POST` | `/api/v1/notifications/broadcast` | Send announcement |
| `GET` | `/api/v1/reports/dashboard/:hostelId` | Dashboard stats |
| `GET` | `/api/v1/reports/revenue-trend/:hostelId` | Revenue chart data |
| `GET` | `/api/v1/reports/occupancy/:hostelId` | Occupancy report |
| `GET` | `/api/v1/reports/fees/:hostelId` | Fee report |
| `GET` | `/api/v1/reports/complaints/:hostelId` | Complaint analytics |
| `GET` | `/api/v1/reports/gate-passes/:hostelId` | Gate pass report |
| `GET` | `/api/v1/reports/visitors/:hostelId` | Visitor report |
| `GET` | `/api/v1/reports/mess/:hostelId` | Mess report |
| `GET` | `/api/v1/reports/login-activity/:hostelId` | Login activity |
| `POST` | `/api/v1/users` | Create team member |
| `GET` | `/api/v1/audit-logs` | View audit trail |

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/admin/dashboard` | Analytics with charts, occupancy grid, activity feed |
| `/admin/students` | Student approvals and management |
| `/admin/rooms` | Room allocation and occupancy grid |
| `/admin/complaints` | Kanban board + table view |
| `/admin/fees` | Fee tracking and payment recording |
| `/admin/mess` | Menu editing and booking stats |
| `/admin/gate-passes` | Gate pass approvals |
| `/admin/visitors` | Visitor log management |
| `/admin/events` | Event creation and management |
| `/admin/reports` | Analytics with 6 report types + export |
| `/admin/settings` | Hostel config, team, notifications, security |
