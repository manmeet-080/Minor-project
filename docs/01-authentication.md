# Authentication & User Management

## Overview

Campusphere uses JWT-based authentication with role-based access control (RBAC). The system supports 5 user roles with different permission levels and features refresh token rotation, session tracking, and password recovery.

## User Roles

| Role | Access Level | Description |
|------|-------------|-------------|
| `SUPER_ADMIN` | Full | System-wide administrator with unrestricted access |
| `ADMIN` | High | Hostel-level admin — manages students, fees, rooms, staff |
| `WARDEN` | High | Hostel warden — similar to admin with hostel oversight |
| `STAFF` | Medium | Handles assigned complaints, attendance, visitor logging |
| `STUDENT` | Standard | Views own data, files complaints, books meals, pays fees |

## Authentication Flow

```
1. Student/Staff/Admin enters email + password
2. Backend validates credentials (bcrypt hash comparison)
3. On success:
   - Access token generated (JWT, 15 min TTL)
   - Refresh token generated (stored in Redis, 7 day TTL)
   - Login recorded in LoginHistory table
4. Frontend stores tokens in Zustand store (persisted to localStorage)
5. All subsequent API calls include Bearer token in Authorization header
6. On 401: frontend auto-refreshes token via /auth/refresh endpoint
7. On refresh failure: user is redirected to /login
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/login` | No | Login with email/password |
| `POST` | `/api/v1/auth/refresh` | No | Refresh access token using refresh token |
| `POST` | `/api/v1/auth/logout` | Yes | Logout (blacklists token in Redis) |
| `GET` | `/api/v1/auth/me` | Yes | Get current user profile with student details |
| `PATCH` | `/api/v1/auth/me` | Yes | Update profile (name, phone, avatar) |
| `GET` | `/api/v1/auth/sessions` | Yes | View login history (last 10 sessions) |
| `POST` | `/api/v1/auth/forgot-password` | No | Send password reset email |
| `POST` | `/api/v1/auth/reset-password` | No | Reset password using token |
| `POST` | `/api/v1/auth/change-password` | Yes | Change password (requires current password) |

## Security Features

- **Password Hashing**: bcryptjs with 12 salt rounds
- **Token Blacklisting**: Logged-out tokens stored in Redis with TTL matching token expiry
- **Login History**: Every login records IP address, user agent, and timestamp
- **Refresh Token Rotation**: Refresh tokens stored in Redis with user-specific keys
- **CORS Protection**: Configurable allowed origins via `CORS_ORIGIN` env var
- **HTTP Security Headers**: Helmet middleware for XSS protection, content type sniffing prevention, etc.

## Frontend Pages

- `/login` — Email/password form with demo credentials, role-based redirect after login
- `/forgot-password` — Email input to request reset link
- `/reset-password` — New password form (token from URL query param)

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@campusphere.edu` | `admin123` |
| Warden | `warden@campusphere.edu` | `warden123` |
| Staff | `staff@campusphere.edu` | `staff123` |
| Student | `arun@student.edu` | `student123` |
