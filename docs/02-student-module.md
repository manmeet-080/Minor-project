# Student Module

## Overview

The student module handles the full student lifecycle — from hostel application and approval to room allocation, fee payment, complaint filing, mess management, and checkout. Students access their portal at `/student/*` routes.

## Features

### 1. Hostel Application & Approval
- Students self-register via `POST /students/apply` (public endpoint, no auth required)
- Application includes: email, password, name, roll number, department, year, gender, parent details, hostel preference
- Application status: `PENDING` → `APPROVED` / `REJECTED`
- Admin approves/rejects from the admin panel

### 2. Profile Management
- View and edit personal info (department, year, parent contact, address)
- Change password via security settings
- Profile includes room/bed assignment details

### 3. Room & Bed Details
- View assigned block, room number, and bed
- See roommates and their details
- Room assignment managed by admin via allocate/transfer endpoints

### 4. Fee Management & Online Payment
- View all fee records (hostel fee, mess fee, maintenance, security deposit, fines)
- Balance summary: total due, total paid, pending count
- **Online payment via Razorpay**: Click "Pay Now" → Razorpay checkout popup → UPI/Card/NetBanking
- Download payment receipts (HTML receipt with hostel branding)
- Fee statuses: PENDING, PAID, OVERDUE, WAIVED, PARTIALLY_PAID

### 5. Complaint Registration
- File complaints with title, description, category, priority
- Categories: Electrical, Plumbing, Furniture, Cleaning, Internet, Pest Control, Security, Maintenance, Other
- Priority levels: Low, Medium, High, Urgent
- Image upload via Cloudinary (up to 5 images)
- Track complaint status with update timeline

### 6. Mess Menu & Meal Booking
- View weekly mess menu (7 days x 4 meals: Breakfast, Lunch, Snacks, Dinner)
- Book and cancel meals for future dates
- Submit feedback and star ratings for meals
- Mess fee auto-calculation based on booked meals

### 7. Gate Pass / Outing Requests
- Request gate passes: Local, Home, Emergency, Medical
- Specify exit date, expected return, destination, reason
- Track pass status: Pending → Approved/Rejected → Checked Out → Returned

### 8. Attendance View
- View monthly attendance records
- Summary: present, absent, late, on leave counts
- Attendance rate percentage with visual progress ring
- Filter by month

### 9. Events
- Browse upcoming hostel events with card-based UI
- RSVP: Going / Maybe / Can't Go
- Filter by category (General, Cultural, Sports, Academic, Festival, Meeting)
- See RSVP count and capacity

### 10. Emergency / Panic Section
- Dedicated emergency page with:
  - Emergency contacts (Police 112, Ambulance 108, Fire 101, Campus Security)
  - Safety instructions for fire, medical, security, and natural disaster emergencies
  - **Panic button** with confirmation dialog
- Panic alert sends real-time notification to all hostel wardens, admins, and staff
- Also initiates phone call to 112

### 11. Notifications
- Real-time notifications via Socket.io
- Types: Info, Warning, Success, Error, Announcement
- Unread badge count
- Mark individual or all as read

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/students/apply` | Submit hostel application |
| `GET` | `/api/v1/students/:id` | Get student profile |
| `GET` | `/api/v1/fees?studentId=` | Get student's fee records |
| `GET` | `/api/v1/fees/student/:id/balance` | Get fee balance summary |
| `POST` | `/api/v1/fees/:id/create-order` | Create Razorpay payment order |
| `POST` | `/api/v1/fees/:id/verify-payment` | Verify and record payment |
| `GET` | `/api/v1/fees/:id/receipt` | Download payment receipt |
| `POST` | `/api/v1/complaints` | File a complaint |
| `GET` | `/api/v1/complaints?studentId=` | List student's complaints |
| `POST` | `/api/v1/complaints/upload` | Upload complaint images |
| `GET` | `/api/v1/mess/menu/:hostelId` | Get mess menu |
| `POST` | `/api/v1/mess/book` | Book a meal |
| `POST` | `/api/v1/mess/cancel` | Cancel meal booking |
| `PATCH` | `/api/v1/mess/bookings/:id/feedback` | Submit meal feedback |
| `GET` | `/api/v1/mess/fee/:studentId` | Calculate mess fee |
| `POST` | `/api/v1/gate-passes` | Request gate pass |
| `GET` | `/api/v1/gate-passes?studentId=` | List student's gate passes |
| `GET` | `/api/v1/attendance/student/:id` | Get attendance history |
| `GET` | `/api/v1/events` | List events |
| `POST` | `/api/v1/events/:id/rsvp` | RSVP to event |
| `POST` | `/api/v1/notifications/sos` | Send SOS alert |
| `GET` | `/api/v1/notifications` | Get notifications |

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/student/dashboard` | Home with stats, meals, notifications |
| `/student/profile` | Edit personal info and password |
| `/student/room` | Room and bed details |
| `/student/fees` | Fee history and online payment |
| `/student/complaints` | File and track complaints |
| `/student/mess` | Menu and meal booking |
| `/student/gate-pass` | Gate pass requests |
| `/student/attendance` | Attendance records |
| `/student/events` | Browse and RSVP to events |
| `/student/emergency` | Emergency contacts and panic button |
