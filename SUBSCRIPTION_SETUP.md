# 🚀 Subscription System Setup Guide

## 📊 Subscription Plans Overview

### **Trial Plan (FREE)**
- **Duration**: 14 days
- **Bookings**: 20 bookings
- **Radius**: 5 KM
- **Services**: 3 services
- **Support**: Email only

### **Basic Plan (PKR 3,500/month)**
- **Bookings**: 50/month
- **Radius**: 10 KM
- **Services**: 8 services
- **Support**: Email

### **Growth Plan (PKR 8,000/month)**
- **Bookings**: 150/month
- **Radius**: 25 KM
- **Services**: 20 services
- **Support**: Email + Chat

### **Premium Plan (PKR 16,000/month)**
- **Bookings**: Unlimited
- **Radius**: Unlimited
- **Services**: Unlimited
- **Support**: Priority (Phone + Chat + Email)

---

## 🛠️ Installation Steps

### 1. Update Database Schema
```bash
npx prisma db push
npx prisma generate
```

### 2. Seed Subscription Plans
```bash
npx tsx prisma/seed-plans.ts
```

### 3. Add Environment Variables
Add to `.env.local`:
```env
XPAY_MERCHANT_ID="your_merchant_id"
XPAY_API_KEY="your_api_key"
XPAY_SECRET_KEY="your_secret_key"
XPAY_BASE_URL="https://xpay.postexglobal.com/api"
```

### 4. Get XPay Credentials
1. Visit: https://xpay.postexglobal.com
2. Register merchant account
3. Get API credentials from dashboard
4. Configure webhook URL: `https://yourdomain.com/api/webhooks/xpay`

---

## 📡 API Endpoints

### **Get Plans**
```
GET /api/subscriptions/plans
```

### **Start Trial**
```
POST /api/subscriptions/trial
```

### **Subscribe to Plan**
```
POST /api/subscriptions/checkout
Body: { "planId": "plan_id_here" }
```

### **Check Status**
```
GET /api/subscriptions/status
```

### **Validate Booking Limit**
```
GET /api/subscriptions/validate
```

### **Change Plan**
```
POST /api/subscriptions/change-plan
Body: { "newPlanId": "new_plan_id" }
```

### **Cancel Subscription**
```
POST /api/subscriptions/cancel
Body: { "reason": "optional_reason" }
```

---

## 🔄 Booking Flow with Subscription Check

### When Nurse Accepts Booking:

```typescript
import { validateNurseBooking, recordBookingAccepted } from '@/middleware/subscriptionCheck';

// Before accepting booking
const validation = await validateNurseBooking(nurseId);

if (!validation.allowed) {
  return {
    error: validation.error,
    needsUpgrade: validation.needsUpgrade,
    suggestedPlan: validation.suggestedPlan,
  };
}

// Accept booking
await acceptBooking(bookingId, nurseId);

// Increment booking count
await recordBookingAccepted(nurseId);
```

---

## 🎯 Blocking Rules

### **Trial Plan**
- Hits 20 bookings → Status: PAUSED → Show upgrade prompt
- 14 days end → Status: PAUSED → Show upgrade prompt

### **Basic Plan**
- Hits 50 bookings → Status: PAUSED → Suggest Growth Plan

### **Growth Plan**
- Hits 150 bookings → Status: PAUSED → Suggest Premium Plan

### **Premium Plan**
- No limits

---

## 🔔 Webhook Events

XPay will send webhooks for:

- `payment.success` - Payment completed
- `payment.failed` - Payment failed
- `subscription.activated` - Subscription started
- `subscription.renewed` - Monthly renewal
- `subscription.payment_failed` - Renewal failed
- `subscription.cancelled` - User cancelled
- `subscription.expired` - Subscription ended

---

## 🧪 Testing

### Test Payment Flow:
1. Create nurse account
2. Start trial: `POST /api/subscriptions/trial`
3. Accept 20 bookings (should block)
4. Subscribe to Basic: `POST /api/subscriptions/checkout`
5. Complete XPay payment
6. Webhook activates subscription
7. Accept bookings (should work)

### Test Webhook Locally:
```bash
# Use ngrok for local testing
ngrok http 3000

# Update XPay webhook URL to:
https://your-ngrok-url.ngrok.io/api/webhooks/xpay
```

---

## 📊 Admin Dashboard Queries

### Active Subscriptions Count:
```typescript
const activeCount = await prisma.nurseSubscription.count({
  where: { status: 'ACTIVE' }
});
```

### Revenue This Month:
```typescript
const revenue = await prisma.nurseSubscription.aggregate({
  where: {
    lastPaymentDate: {
      gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    }
  },
  _sum: { lastPaymentAmount: true }
});
```

### Expiring Soon:
```typescript
const expiringSoon = await prisma.nurseSubscription.findMany({
  where: {
    status: 'ACTIVE',
    endDate: {
      lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  },
  include: { nurse: { include: { user: true } }, plan: true }
});
```

---

## 🔧 Cron Jobs (Optional)

Add to your deployment platform:

### Reset Monthly Bookings (1st of every month):
```typescript
import { resetMonthlyBookings } from '@/lib/subscription';
await resetMonthlyBookings();
```

### Expire Subscriptions (Daily):
```typescript
import { expireSubscriptions } from '@/lib/subscription';
await expireSubscriptions();
```

---

## 💳 Supported Payment Methods

XPay PostEx supports:
- ✅ Easypaisa
- ✅ JazzCash
- ✅ PayPak
- ✅ Visa/Mastercard
- ✅ Bank Transfer

---

## 🆘 Troubleshooting

### Webhook not working?
- Check XPay dashboard webhook logs
- Verify signature validation
- Check server logs: `console.log` in webhook handler

### Payment not activating subscription?
- Check `xpayOrderId` matches
- Verify webhook signature is correct
- Check database for subscription status

### Booking limit not enforcing?
- Ensure `validateNurseBooking()` is called before accepting
- Check subscription status in database
- Verify `bookingsUsed` is incrementing

---

## 📞 Support

- **XPay Support**: support@postexglobal.com
- **Documentation**: https://xpay.postexglobal.com/docs
