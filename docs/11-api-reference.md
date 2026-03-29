# API Reference

## Base URL

```
http://localhost:4000/api/v1
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format

All responses follow a consistent format:
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

## Endpoints by Module

### Auth (9 endpoints)
| Method | Path | Auth | Body/Params |
|--------|------|------|-------------|
| POST | `/auth/login` | - | `{ email, password }` |
| POST | `/auth/refresh` | - | `{ refreshToken }` |
| POST | `/auth/logout` | Yes | - |
| GET | `/auth/me` | Yes | - |
| PATCH | `/auth/me` | Yes | `{ name?, phone?, avatarUrl? }` |
| GET | `/auth/sessions` | Yes | - |
| POST | `/auth/forgot-password` | - | `{ email }` |
| POST | `/auth/reset-password` | - | `{ token, password }` |
| POST | `/auth/change-password` | Yes | `{ currentPassword, newPassword }` |

### Students (8 endpoints)
| Method | Path | Auth | Body/Params |
|--------|------|------|-------------|
| POST | `/students/apply` | - | `{ email, password, name, rollNumber, department, year, gender, parentName, parentPhone, permanentAddress, hostelId }` |
| GET | `/students` | Admin | `?page&limit&status&search&sortBy&sortOrder` |
| GET | `/students/:id` | Yes | - |
| PATCH | `/students/:id` | Admin | `{ department?, year?, parentName?, parentPhone?, permanentAddress? }` |
| POST | `/students/:id/approve` | Admin | - |
| POST | `/students/:id/reject` | Admin | `{ reason? }` |
| POST | `/students/:id/checkout` | Admin | - |
| POST | `/students/:id/transfer` | Admin | `{ newBedId }` |

### Rooms (8 endpoints)
| Method | Path | Auth | Body/Params |
|--------|------|------|-------------|
| GET | `/rooms` | Yes | `?hostelId&blockId&status&floor&page&limit` |
| GET | `/rooms/:id` | Yes | - |
| POST | `/rooms` | Admin | `{ roomNumber, blockId, floor, type, capacity, amenities? }` |
| PATCH | `/rooms/:id` | Admin | `{ roomNumber?, floor?, type?, capacity?, status?, amenities? }` |
| POST | `/rooms/allocate` | Admin | `{ bedId, studentId }` |
| POST | `/rooms/beds/:bedId/vacate` | Admin | - |
| GET | `/rooms/blocks/:hostelId` | Yes | - |
| POST | `/rooms/blocks` | Admin | `{ name, hostelId, floors }` |

### Complaints (6 endpoints)
| Method | Path | Auth | Body/Params |
|--------|------|------|-------------|
| GET | `/complaints` | Yes | `?hostelId&status&studentId&assignedToId&category&priority&page&limit&search` |
| GET | `/complaints/:id` | Yes | - |
| POST | `/complaints` | Yes | `{ title, description, category, priority?, images?, studentId, hostelId, roomId? }` |
| PATCH | `/complaints/:id/assign` | Admin | `{ assignedToId }` |
| PATCH | `/complaints/:id/status` | Yes | `{ status, message }` |
| POST | `/complaints/upload` | Yes | `FormData: images (max 5 files, image/jpeg\|png\|webp\|gif)` |

### Fees (9 endpoints)
| Method | Path | Auth | Body/Params |
|--------|------|------|-------------|
| GET | `/fees` | Yes | `?hostelId&studentId&status&type&page&limit` |
| GET | `/fees/student/:studentId/balance` | Yes | - |
| GET | `/fees/:id` | Yes | - |
| POST | `/fees` | Admin | `{ studentId, hostelId, type, amount, dueDate, remarks? }` |
| PATCH | `/fees/:id/pay` | Admin | `{ paidAmount, paymentMethod, transactionId? }` |
| PATCH | `/fees/:id/waive` | Admin | `{ remarks }` |
| GET | `/fees/:id/receipt` | Yes | Returns HTML receipt |
| POST | `/fees/:id/create-order` | Yes | Creates Razorpay order |
| POST | `/fees/:id/verify-payment` | Yes | `{ razorpayPaymentId, razorpayOrderId, razorpaySignature }` |

### Mess (8 endpoints)
| Method | Path | Auth | Body/Params |
|--------|------|------|-------------|
| GET | `/mess/menu/:hostelId` | Yes | - |
| PUT | `/mess/menu/:hostelId` | Admin | `{ dayOfWeek, mealType, items[] }` |
| POST | `/mess/book` | Yes | `{ studentId, hostelId, date, mealType }` |
| POST | `/mess/cancel` | Yes | `{ studentId, date, mealType }` |
| PATCH | `/mess/bookings/:bookingId/feedback` | Yes | `{ feedback?, rating }` |
| GET | `/mess/bookings/:studentId` | Yes | `?startDate&endDate` |
| GET | `/mess/report/:hostelId` | Admin | `?month&year` |
| GET | `/mess/fee/:studentId` | Yes | `?month&year&rate` |

### Gate Passes (6 endpoints)
| Method | Path | Auth | Body/Params |
|--------|------|------|-------------|
| GET | `/gate-passes` | Yes | `?hostelId&studentId&status&page&limit` |
| POST | `/gate-passes` | Yes | `{ studentId, hostelId, type, reason, destination, exitDate, expectedReturn }` |
| PATCH | `/gate-passes/:id/approve` | Admin | `{ remarks? }` |
| PATCH | `/gate-passes/:id/reject` | Admin | `{ remarks? }` |
| PATCH | `/gate-passes/:id/checkout` | Yes | - |
| PATCH | `/gate-passes/:id/return` | Yes | - |

### Visitors (3 endpoints)
| Method | Path | Auth | Body/Params |
|--------|------|------|-------------|
| GET | `/visitors` | Yes | `?hostelId&date&page&limit` |
| POST | `/visitors` | Staff+ | `{ hostelId, visitorName, visitorPhone, purpose, studentId?, idProof }` |
| PATCH | `/visitors/:id/exit` | Staff+ | - |

### Notifications (5 endpoints)
| Method | Path | Auth | Body/Params |
|--------|------|------|-------------|
| GET | `/notifications` | Yes | `?page&limit&unreadOnly` |
| PATCH | `/notifications/:id/read` | Yes | - |
| PATCH | `/notifications/read-all` | Yes | - |
| POST | `/notifications/broadcast` | Admin | `{ hostelId, title, message }` |
| POST | `/notifications/sos` | Yes | Rate limited: 3/15min |

### Reports (9 endpoints)
| Method | Path | Auth | Params |
|--------|------|------|--------|
| GET | `/reports/dashboard/:hostelId` | Admin | - |
| GET | `/reports/occupancy/:hostelId` | Admin | - |
| GET | `/reports/fees/:hostelId` | Admin | `?startDate&endDate` |
| GET | `/reports/complaints/:hostelId` | Admin | - |
| GET | `/reports/revenue-trend/:hostelId` | Admin | `?months` (max 24) |
| GET | `/reports/gate-passes/:hostelId` | Admin | - |
| GET | `/reports/visitors/:hostelId` | Admin | - |
| GET | `/reports/mess/:hostelId` | Admin | - |
| GET | `/reports/login-activity/:hostelId` | Admin | - |

### Users (4 endpoints)
| Method | Path | Auth | Body/Params |
|--------|------|------|-------------|
| GET | `/users` | Admin | `?hostelId&role&page&limit` |
| POST | `/users` | Admin | `{ email, password, name, phone?, role, hostelId }` |
| PATCH | `/users/:id` | Admin | `{ name?, phone?, role?, isActive? }` |
| PATCH | `/users/:id/deactivate` | Admin | - |

### Hostels (2 endpoints)
| Method | Path | Auth | Body/Params |
|--------|------|------|-------------|
| GET | `/hostels/:id` | Yes | - |
| PATCH | `/hostels/:id` | Admin | `{ name?, address?, phone?, email?, wardenId? }` |

### Attendance (4 endpoints)
| Method | Path | Auth | Body/Params |
|--------|------|------|-------------|
| POST | `/attendance` | Staff+ | `{ studentId, hostelId, date (YYYY-MM-DD), status, remarks? }` |
| POST | `/attendance/bulk` | Staff+ | `{ studentIds[], hostelId, date, status }` |
| GET | `/attendance/student/:studentId` | Yes | `?month&year&page&limit` |
| GET | `/attendance/daily/:hostelId` | Staff+ | `?date` |

### Events (6 endpoints)
| Method | Path | Auth | Body/Params |
|--------|------|------|-------------|
| GET | `/events` | Yes | `?hostelId&category&upcoming&page&limit` |
| GET | `/events/:id` | Yes | Returns RSVP list + user's RSVP status |
| POST | `/events` | Admin | `{ title, description, venue, date, endDate?, capacity?, imageUrl?, category?, hostelId }` |
| PATCH | `/events/:id` | Admin | Partial update of any field |
| DELETE | `/events/:id` | Admin | Soft delete |
| POST | `/events/:id/rsvp` | Yes | `{ status: GOING\|MAYBE\|NOT_GOING }` |

### Audit Logs (1 endpoint)
| Method | Path | Auth | Params |
|--------|------|------|--------|
| GET | `/audit-logs` | Admin | `?hostelId&userId&entity&action&page&limit` |

### Health Check
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | - | Returns `{ status: "ok", timestamp }` |

**Total: 88 endpoints across 15 modules**
