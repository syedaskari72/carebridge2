# CareBridge - Build & Deployment Guide

## 🔧 Build Configuration

### **Automated Prisma Generation**

The build process now automatically generates the Prisma client to prevent deployment issues:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "prebuild": "prisma generate",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  }
}
```

### **Build Process Steps**
1. **prebuild**: Automatically runs `prisma generate` before building
2. **build**: Compiles the Next.js application
3. **postinstall**: Generates Prisma client after npm install

## 🚀 Local Development

### **Setup Commands**
```bash
# Install dependencies and generate Prisma client
npm install

# Start development server
npm run dev

# Access database GUI
npm run db:studio

# Push schema changes to database
npm run db:push
```

### **Development Environment**
- **Hot Reload**: Automatic page refresh on changes
- **Turbopack**: Fast development builds
- **TypeScript**: Real-time type checking
- **Prisma Studio**: Database management interface

## 📦 Production Build

### **Build Commands**
```bash
# Production build (includes Prisma generation)
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### **Build Output**
```
Route (app)                                 Size  First Load JS    
┌ ○ /                                      165 B         103 kB
├ ○ /_not-found                            996 B         101 kB
├ ƒ /api/admin/change-role                 170 B        99.8 kB
├ ƒ /api/admin/payments                    170 B        99.8 kB
├ ƒ /api/admin/stats                       170 B        99.8 kB
├ ƒ /api/admin/users                       170 B        99.8 kB
├ ƒ /api/admin/verify-document             170 B        99.8 kB
├ ƒ /api/admin/verify-nurse                170 B        99.8 kB
├ ƒ /api/auth/[...nextauth]                170 B        99.8 kB
├ ƒ /api/auth/register                     170 B        99.8 kB
├ ƒ /api/doctor/dashboard                  170 B        99.8 kB
├ ƒ /api/emergency                         170 B        99.8 kB
├ ƒ /api/nurse/checkin                     170 B        99.8 kB
├ ƒ /api/nurse/checkout                    170 B        99.8 kB
├ ƒ /api/nurse/dashboard                   170 B        99.8 kB
├ ƒ /api/nurse/sos                         170 B        99.8 kB
├ ƒ /api/patient/dashboard                 170 B        99.8 kB
├ ○ /assistant                           1.92 kB         102 kB
├ ○ /auth/admin                          4.79 kB         125 kB
├ ○ /auth/emergency                      2.24 kB         102 kB
├ ○ /auth/signin                         3.95 kB         152 kB
├ ○ /auth/signup                          9.8 kB         149 kB
├ ○ /book                                1.37 kB         101 kB
├ ○ /book/doctor                         6.15 kB         151 kB
├ ○ /book/nurse                          5.66 kB         151 kB
├ ○ /bookings                            1.51 kB         101 kB
├ ○ /dashboard/admin                     5.49 kB         151 kB
├ ○ /dashboard/doctor                    3.03 kB         115 kB
├ ○ /dashboard/nurse                     5.94 kB         126 kB
├ ○ /dashboard/nurse/safety              5.89 kB         129 kB
├ ○ /dashboard/patient                    5.5 kB         126 kB
├ ○ /dashboard/patient/records           4.83 kB         125 kB
├ ○ /dashboard/patient/tracking          6.18 kB         126 kB
├ ○ /emergency                           5.97 kB         123 kB
├ ○ /nurses                              1.59 kB         101 kB
└ ○ /profile                             1.95 kB         102 kB
+ First Load JS shared by all            99.7 kB
```

## ☁️ Vercel Deployment

### **Automatic Deployment**
1. **Connect Repository**: Link GitHub repo to Vercel
2. **Environment Variables**: Add production environment variables
3. **Auto Deploy**: Automatic deployment on git push

### **Environment Variables for Vercel**
```env
# Database
DATABASE_URL="your_production_neondb_url"

# NextAuth
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your_secure_random_string"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### **Vercel Configuration**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

## 🐳 Docker Deployment

### **Dockerfile**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### **Docker Compose**
```yaml
version: '3.8'
services:
  carebridge:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=carebridge
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 🔍 Build Troubleshooting

### **Common Issues & Solutions**

#### **Prisma Client Not Generated**
```bash
# Solution: Run Prisma generate manually
npx prisma generate

# Or rebuild with automatic generation
npm run build
```

#### **Database Connection Issues**
```bash
# Check database connection
npx prisma db push

# Reset database if needed
npx prisma migrate reset
```

#### **TypeScript Errors**
```bash
# Check for type errors
npx tsc --noEmit

# Fix and rebuild
npm run build
```

#### **Environment Variables Missing**
```bash
# Check environment variables are set
echo $DATABASE_URL
echo $NEXTAUTH_SECRET

# Create .env.local for development
cp .env.example .env.local
```

### **Build Verification Checklist**
- ✅ Prisma client generated successfully
- ✅ TypeScript compilation passes
- ✅ All environment variables set
- ✅ Database connection working
- ✅ Static pages generated (38/38)
- ✅ No build errors or warnings

## 📊 Performance Optimization

### **Build Optimizations**
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination
- **Image Optimization**: Next.js image optimization
- **Bundle Analysis**: Optimized bundle sizes
- **Static Generation**: Pre-rendered pages where possible

### **Runtime Optimizations**
- **Caching**: Aggressive caching strategies
- **Compression**: Gzip/Brotli compression
- **CDN**: Static asset delivery via CDN
- **Database**: Optimized queries and indexing
- **PWA**: Service worker caching

## 🔒 Security Considerations

### **Build Security**
- **Environment Variables**: Secure secret management
- **Dependencies**: Regular security updates
- **Code Scanning**: Automated vulnerability scanning
- **HTTPS**: Enforce HTTPS in production
- **Headers**: Security headers configuration

### **Runtime Security**
- **Authentication**: Secure session management
- **Authorization**: Role-based access control
- **Input Validation**: All inputs validated
- **SQL Injection**: Prisma ORM protection
- **XSS Protection**: Content Security Policy

## 📈 Monitoring & Maintenance

### **Health Checks**
```bash
# Application health
curl https://your-domain.com/api/health

# Database health
npx prisma db ping

# Build status
npm run build
```

### **Maintenance Tasks**
- **Dependencies**: Regular updates
- **Database**: Backup and maintenance
- **Logs**: Monitor application logs
- **Performance**: Regular performance audits
- **Security**: Security updates and patches

## 🚀 Deployment Checklist

### **Pre-Deployment**
- ✅ All tests passing
- ✅ Build successful locally
- ✅ Environment variables configured
- ✅ Database schema up to date
- ✅ Security review completed

### **Deployment**
- ✅ Deploy to staging environment
- ✅ Run integration tests
- ✅ Performance testing
- ✅ Security scanning
- ✅ Deploy to production

### **Post-Deployment**
- ✅ Health checks passing
- ✅ Application accessible
- ✅ All features working
- ✅ Performance metrics good
- ✅ Error monitoring active

---

**CareBridge** is now configured for reliable, automated builds and deployments with proper Prisma client generation and comprehensive monitoring.
