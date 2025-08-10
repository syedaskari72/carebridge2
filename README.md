# CareBridge - Healthcare at Home PWA

## 🏥 Overview

CareBridge is a comprehensive Progressive Web Application (PWA) that connects patients with healthcare professionals for on-demand home healthcare services. Built with Next.js 15, TypeScript, and Prisma, it provides a seamless mobile-first experience for patients, nurses, doctors, and administrators.

## ✨ Key Features

### 🔐 **Multi-Role Authentication System**
- **Patient Portal**: Book nurses, track health, manage appointments
- **Nurse Dashboard**: Manage assignments, safety features, patient care
- **Doctor Dashboard**: Consultations, case management, approvals
- **Admin Panel**: User management, verification, system oversight

### 📱 **Progressive Web App (PWA)**
- **Installable**: Download and install on mobile devices
- **Offline Support**: Core functionality works offline
- **Push Notifications**: Real-time updates and alerts
- **Mobile-First Design**: Optimized for touch interfaces

### 🌙 **Dark Mode Support**
- **Automatic Theme Detection**: Follows system preferences
- **Manual Toggle**: User-controlled theme switching
- **Consistent Theming**: All components support both modes

### 🔒 **Security & Safety**
- **Role-Based Access Control**: Secure authentication system
- **Emergency Features**: SOS buttons and emergency contacts
- **Data Encryption**: Secure handling of medical data
- **HIPAA Compliance Ready**: Privacy-focused architecture

## 🚀 Technology Stack

### **Frontend**
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Shadcn/UI**: Modern component library
- **Lucide Icons**: Beautiful icon system

### **Backend**
- **Next.js API Routes**: Serverless backend
- **NextAuth.js**: Authentication system
- **Prisma ORM**: Database management
- **NeonDB**: PostgreSQL database

### **External Services**
- **Cloudinary**: Document and image storage
- **Vercel**: Deployment and hosting
- **PWA**: Service worker for offline functionality

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (NeonDB recommended)
- Cloudinary account (for file uploads)

## 🛠️ Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/carebridge2.git
cd carebridge2
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create `.env.local` file:
```env
# Database
DATABASE_URL="your_neondb_connection_string"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secret_key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### 4. Database Setup
```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📱 PWA Installation

### **Mobile Installation**
1. **Android**: Tap browser menu → "Add to Home screen"
2. **iOS**: Tap Share button → "Add to Home Screen"
3. **Desktop**: Look for install icon in address bar

### **Features After Installation**
- Standalone app experience
- Offline functionality
- Push notifications
- Fast loading with caching

## 👥 User Roles & Access

### **Patient**
- Book nurse/doctor services
- Track health records
- Manage appointments
- Emergency assistance

### **Nurse**
- View assignments
- Safety check-in/out
- Patient care tracking
- Emergency SOS

### **Doctor**
- Case consultations
- Approve treatments
- Patient management
- Emergency response

### **Admin**
- User management
- Nurse verification
- System analytics
- Payment tracking

## 🔧 Development

### **Project Structure**
```
src/
├── app/                 # Next.js App Router
├── components/          # Reusable components
├── lib/                # Utilities and configurations
├── types/              # TypeScript type definitions
└── styles/             # Global styles

prisma/
├── schema.prisma       # Database schema
└── migrations/         # Database migrations

public/
├── icons/              # PWA icons
├── manifest.json       # PWA manifest
└── sw.js              # Service worker
```

### **Key Commands**
```bash
npm run dev          # Development server
npm run build        # Production build (includes prisma generate)
npm run start        # Production server
npm run lint         # ESLint check
npm run db:push      # Push schema to database
npm run db:studio    # Database GUI
```

### **Build Process**
The build process automatically runs `prisma generate` to ensure the Prisma client is always up to date:
- **prebuild**: Generates Prisma client before building
- **postinstall**: Generates Prisma client after npm install
- **Automatic**: No manual Prisma generation needed

## 🚀 Deployment

### **Vercel Deployment**
1. Connect GitHub repository to Vercel
2. Add environment variables
3. Deploy automatically on push

### **Environment Variables for Production**
- `DATABASE_URL`: Production database connection
- `NEXTAUTH_URL`: Production domain
- `NEXTAUTH_SECRET`: Secure random string
- `CLOUDINARY_*`: Production Cloudinary credentials

## 📊 Features Overview

### **Patient Features**
- ✅ Service booking (nurse/doctor)
- ✅ Health tracking dashboard
- ✅ Appointment management
- ✅ Emergency assistance
- ✅ Medical records access

### **Nurse Features**
- ✅ Assignment dashboard
- ✅ Safety check-in/out system
- ✅ Patient care tracking
- ✅ Emergency SOS button
- ✅ Document verification

### **Doctor Features**
- ✅ Consultation management
- ✅ Case approval system
- ✅ Patient overview
- ✅ Emergency case handling
- ✅ Treatment planning

### **Admin Features**
- ✅ User management system
- ✅ Nurse verification process
- ✅ Payment tracking
- ✅ System analytics
- ✅ Role management

## 🔐 Authentication

### **Default Admin Access**
- **Email**: admin@carebridge.com
- **Password**: admin@123

### **User Registration**
- Patients: Self-registration
- Nurses: Registration + admin verification
- Doctors: Admin-created accounts
- Admins: System-created accounts

## 📱 Mobile Features

### **PWA Capabilities**
- ✅ Installable on mobile devices
- ✅ Offline functionality
- ✅ Push notifications ready
- ✅ App-like navigation
- ✅ Fast loading with caching

### **Mobile-First Design**
- ✅ Touch-friendly interfaces
- ✅ Responsive layouts
- ✅ Optimized for small screens
- ✅ Gesture support

## 🌙 Dark Mode

### **Theme Features**
- ✅ System preference detection
- ✅ Manual theme toggle
- ✅ Persistent theme selection
- ✅ All components support both modes

## 🔒 Security Features

### **Data Protection**
- ✅ Role-based access control
- ✅ Secure authentication
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection

### **Healthcare Compliance**
- ✅ HIPAA-ready architecture
- ✅ Secure data handling
- ✅ Audit trails
- ✅ Privacy controls

## 📞 Support

For technical support or questions:
- **Email**: support@carebridge.com
- **Documentation**: [GitHub Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**CareBridge** - Bringing healthcare home, one click at a time. 🏥💙
