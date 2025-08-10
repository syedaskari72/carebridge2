# CareBridge Setup Guide

## Overview
CareBridge is a PWA for on-demand healthcare services with AI assistance, built with Next.js 15, Prisma, and Neon PostgreSQL.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Database**: Neon PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **PWA**: Service Worker, Web App Manifest
- **AI**: OpenAI GPT-4 or Azure OpenAI (for medical assistant)
- **Payments**: Stripe
- **Notifications**: Twilio (SMS), Email
- **File Storage**: AWS S3 or Cloudinary

## Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Install dependencies
npm install

# Install additional packages
npm install prisma @prisma/client next-auth stripe twilio @aws-sdk/client-s3
npm install -D @types/node
```

### 2. Database Setup (Neon)
1. Create account at [neon.tech](https://neon.tech)
2. Create new project: "carebridge"
3. Copy connection string to `.env.local` as `DATABASE_URL`
4. Initialize Prisma:
```bash
npx prisma generate
npx prisma db push
```

### 3. Authentication Setup (NextAuth.js)
1. Generate secret: `openssl rand -base64 32`
2. Add to `.env.local` as `NEXTAUTH_SECRET`
3. Configure providers in `src/app/api/auth/[...nextauth]/route.ts`

### 4. AI Assistant Setup
Choose one option:

**Option A: OpenAI**
1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add `OPENAI_API_KEY` to `.env.local`

**Option B: Azure OpenAI**
1. Create Azure OpenAI resource
2. Deploy GPT-4 model
3. Add Azure credentials to `.env.local`

### 5. Payment Setup (Stripe)
1. Create account at [stripe.com](https://stripe.com)
2. Get test keys from dashboard
3. Add `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` to `.env.local`

### 6. Run Development Server
```bash
npm run dev
```

## Database Schema

Based on the UML diagram, the schema includes:

### Core Models
- **User**: Base user model (email, name, phone, address)
- **Patient**: Extends User (medical info, emergency contact, preferences)
- **Nurse**: Extends User (license, specialties, availability, rating)
- **Admin**: Extends User (admin role, permissions)

### Business Logic Models
- **Booking**: Service requests (patient ↔ nurse association)
- **Payment**: Payment processing and invoicing
- **ChatSession**: AI assistant conversations

### Key Relationships
- User → Patient/Nurse/Admin (inheritance via userType)
- Patient → Bookings (one-to-many)
- Nurse → Bookings (one-to-many)
- Booking → Payment (one-to-one)
- Patient → ChatSessions (one-to-many)

## API Routes Structure

```
/api/
├── auth/[...nextauth]/     # NextAuth.js authentication
├── bookings/
│   ├── route.ts           # GET, POST bookings
│   └── [id]/
│       ├── route.ts       # GET, PUT, DELETE specific booking
│       ├── confirm/       # POST confirm booking
│       └── cancel/        # POST cancel booking
├── nurses/
│   ├── route.ts           # GET nurses, POST nurse registration
│   └── [id]/route.ts      # GET, PUT nurse profile
├── patients/
│   └── [id]/route.ts      # GET, PUT patient profile
├── payments/
│   ├── route.ts           # POST create payment intent
│   └── webhook/route.ts   # Stripe webhook handler
├── chat/
│   └── route.ts           # POST chat with AI assistant
└── admin/
    ├── nurses/route.ts    # Admin nurse management
    └── bookings/route.ts  # Admin booking management
```

## PWA Features

### Service Worker (`public/sw.js`)
- Offline-first caching strategy
- Network-first for navigation
- Cache-first for static assets

### Web App Manifest (`public/manifest.webmanifest`)
- Installable on mobile devices
- App shortcuts for quick actions
- Hospital/cyan theme colors

### Installation
1. Open app in mobile browser
2. Look for "Add to Home Screen" or "Install App"
3. App will behave like native mobile app

## Development Workflow

### 1. Database Changes
```bash
# After modifying schema.prisma
npx prisma generate
npx prisma db push

# For production migrations
npx prisma migrate dev --name description
```

### 2. Adding New Features
1. Update Prisma schema if needed
2. Create API routes
3. Build UI components
4. Add to navigation
5. Test PWA functionality

### 3. Testing
```bash
# Run tests
npm test

# Build for production
npm run build

# Test PWA features
npm start  # Production mode required for SW
```

## Deployment

### Recommended: Vercel + Neon
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy automatically

### Environment Variables for Production
- Set all `.env.local` variables in Vercel dashboard
- Use production URLs and API keys
- Enable Stripe live mode
- Configure production database

## Security Considerations

1. **Authentication**: NextAuth.js with secure session handling
2. **Database**: Prisma with parameterized queries (SQL injection protection)
3. **API**: Rate limiting and input validation
4. **Payments**: Stripe handles PCI compliance
5. **Medical Data**: HIPAA considerations for patient information

## Next Steps

1. **Medical AI Integration**: Consider MedPaLM or BioBERT for specialized medical responses
2. **Real-time Features**: Add WebSocket support for live chat and booking updates
3. **Mobile App**: Convert PWA to React Native for app stores
4. **Compliance**: Implement HIPAA compliance measures
5. **Analytics**: Add user behavior tracking and performance monitoring
