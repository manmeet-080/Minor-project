# Payment Gateway (Razorpay)

## Overview

Campusphere integrates Razorpay for online fee payments. Students can pay hostel fees, mess fees, and other charges directly from their fees page using UPI, credit/debit cards, or net banking.

## Payment Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Student    │     │   Backend    │     │   Razorpay   │     │   Backend    │
│  clicks Pay  │────>│ create-order │────>│   Order API  │     │verify-payment│
│              │     │              │<────│  returns ID  │     │              │
│              │     │  returns to  │     │              │     │              │
│              │<────│   frontend   │     │              │     │              │
│              │     │              │     │              │     │              │
│  Razorpay    │     │              │     │   Checkout   │     │              │
│  popup opens │────>│              │────>│   Widget     │     │              │
│              │     │              │     │              │     │              │
│  Payment     │     │              │     │   Processes  │     │              │
│  completed   │<────│              │<────│   Payment    │     │              │
│              │     │              │     │              │     │              │
│  Verify      │     │              │     │              │     │  Verify      │
│  callback    │────>│              │────>│              │────>│  HMAC sig    │
│              │     │              │     │              │     │  Update fee  │
│  Success!    │<────│              │<────│              │<────│  Emit event  │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

## How It Works

### 1. Student initiates payment
Student clicks "Pay Now" on any PENDING or OVERDUE fee record.

### 2. Order creation
Frontend calls `POST /api/v1/fees/:id/create-order`. Backend creates a Razorpay order with the amount due and returns:
```json
{
  "orderId": "order_xxxxx",
  "amount": 45000,
  "currency": "INR",
  "key": "rzp_test_xxxxx"
}
```

### 3. Checkout popup
Frontend opens Razorpay's checkout widget with the order details. Student pays via UPI, card, or net banking.

### 4. Payment verification
On successful payment, Razorpay returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`. Frontend sends these to `POST /api/v1/fees/:id/verify-payment`.

### 5. Signature verification
Backend verifies the HMAC-SHA256 signature using the Razorpay key secret:
```
expected = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
```
If valid, fee record is updated to `PAID`.

### 6. Real-time notification
Socket.io event `fee:paymentRecorded` is emitted to the hostel room, so admin dashboard updates in real-time.

## Security Measures

- **HMAC signature verification** prevents forged payment confirmations
- **Idempotency check** — if fee is already PAID or transaction ID already exists, request is rejected (prevents double-payment)
- **Transaction wrapping** — payment verification runs inside a Prisma transaction to prevent race conditions
- Server-side key secret is never exposed to the frontend

## Configuration

Add these to `apps/backend/.env`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

Get test keys from [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys).

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/fees/:id/create-order` | Yes | Create Razorpay order for a fee |
| `POST` | `/api/v1/fees/:id/verify-payment` | Yes | Verify payment signature and record |
| `GET` | `/api/v1/fees/:id/receipt` | Yes | Download payment receipt (HTML) |

## Supported Payment Methods

Via Razorpay checkout:
- UPI (Google Pay, PhonePe, Paytm)
- Credit / Debit Cards
- Net Banking
- Wallets
