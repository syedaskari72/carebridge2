# CareBridge - Testing Guide

## 🚀 **Quick Start Testing**

### **1. Start the Application**
```bash
npm run dev
```
The app will be available at `http://localhost:3000`

### **2. Test Dark/Light Mode**
- Look for the theme toggle button (sun/moon icon) in the header
- Click to switch between light and dark modes
- Verify all components have proper contrast in both modes
- Check that dropdowns, buttons, and forms are visible in both themes

### **3. Test Authentication Flows**

#### **Patient Registration**
1. Go to `/auth/signup`
2. Select "Patient" as user type
3. Fill in: Name, Email, Phone, CNIC, Address
4. Click "Get Current Location" to test GPS functionality
5. Complete registration

#### **Nurse Registration**
1. Go to `/auth/signup`
2. Select "Nurse" as user type
3. Fill in professional details (Department, License Number, Experience)
4. Upload documents (PDF files for verification)
5. Complete registration (will require admin verification)

#### **Doctor Registration**
1. Go to `/auth/signup`
2. Select "Doctor" as user type
3. Fill in specialization, department, license
4. Upload verification documents
5. Complete registration (will require admin verification)

### **4. Test Role-Based Dashboards**

#### **Patient Dashboard** (`/dashboard/patient`)
- View upcoming appointments
- Check recent treatments
- See active prescriptions
- Test emergency button
- Navigate to medical records

#### **Nurse Dashboard** (`/dashboard/nurse`)
- Test check-in/check-out functionality
- Try the SOS panic button (will show alert)
- View patient assignments
- Check safety status indicators

#### **Doctor Dashboard** (`/dashboard/doctor`)
- Toggle on-call status
- Review pending cases
- Test case approval/rejection
- View emergency alerts

#### **Admin Dashboard** (`/dashboard/admin`)
- View user statistics
- Check pending verifications
- Test document download functionality
- Monitor safety alerts

### **5. Test PWA Installation**

#### **On Mobile (Android)**
1. Open `http://localhost:3000` in Chrome
2. Wait for install prompt (appears after 10 seconds)
3. Or manually: Menu → "Add to Home Screen"
4. App will install like a native app

#### **On Mobile (iOS)**
1. Open in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. App appears on home screen

#### **On Desktop**
1. Look for install icon in address bar
2. Click to install as desktop app
3. App opens in standalone window

### **6. Test Emergency Features**

#### **Emergency Access (No Signup)**
1. Go to `/auth/emergency`
2. Fill in emergency details
3. Test location detection
4. Submit emergency request

#### **Nurse Safety Features**
1. Login as nurse
2. Test check-in with location
3. Try SOS button (shows confirmation dialog)
4. Test check-out functionality

### **7. Test Medical Records**

#### **Patient Records** (`/dashboard/patient/records`)
1. View personal information tab
2. Check prescriptions with remaining days
3. Review treatment history with vitals
4. See doctor consultations

## 🧪 **Feature Testing Checklist**

### **✅ Authentication & Registration**
- [ ] Patient signup with location picker
- [ ] Nurse signup with document upload
- [ ] Doctor signup with specialization
- [ ] Email/password login for all roles
- [ ] Google OAuth login
- [ ] Emergency access without signup
- [ ] Role-based dashboard redirects

### **✅ Dark/Light Mode**
- [ ] Theme toggle in header works
- [ ] All components visible in dark mode
- [ ] Dropdowns have proper contrast
- [ ] Forms are readable in both modes
- [ ] Cards and buttons themed correctly
- [ ] Theme preference persists

### **✅ PWA Features**
- [ ] Install prompt appears
- [ ] App installs on mobile
- [ ] Works offline (basic functionality)
- [ ] App icon appears correctly
- [ ] Standalone mode works

### **✅ Role-Based Access**
- [ ] Patients can't access nurse dashboard
- [ ] Nurses can't access doctor dashboard
- [ ] Admins can access all areas
- [ ] Proper redirects for unauthorized access

### **✅ Safety Features**
- [ ] Nurse check-in/check-out works
- [ ] SOS button shows confirmation
- [ ] Location tracking requests permission
- [ ] Emergency alerts logged

### **✅ Medical Records**
- [ ] Patient records display correctly
- [ ] Treatment history shows vitals
- [ ] Prescriptions show remaining days
- [ ] Tabs navigation works

### **✅ Admin Features**
- [ ] User statistics display
- [ ] Pending verifications shown
- [ ] Document download simulated
- [ ] Safety alerts monitored

## 🔧 **Development Testing**

### **API Endpoints to Test**
```bash
# Registration
POST /api/auth/register

# Emergency cases
POST /api/emergency

# Nurse safety
POST /api/nurse/checkin
POST /api/nurse/checkout
POST /api/nurse/sos

# Admin verification
POST /api/admin/verify-user
```

### **Database Testing**
```bash
# Generate Prisma client
npx prisma generate

# View database
npx prisma studio
```

## 🐛 **Known Issues & Workarounds**

### **Build Warnings**
- Some Next.js build warnings are normal during development
- App functions correctly despite warnings

### **Location Services**
- Requires HTTPS in production for GPS
- Works on localhost for testing

### **File Uploads**
- Document upload simulated in development
- Real file storage needs cloud integration

## 📱 **Mobile Testing Tips**

### **Testing on Real Devices**
1. Connect phone to same WiFi as development machine
2. Find your computer's IP address
3. Access `http://[YOUR_IP]:3000` on mobile
4. Test PWA installation and features

### **Responsive Design**
- Test on various screen sizes
- Check mobile navigation
- Verify touch interactions
- Test PWA install flow

## 🎯 **Production Testing Checklist**

### **Before Deployment**
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] SSL certificate configured
- [ ] PWA manifest valid
- [ ] Service worker registered
- [ ] Error handling tested
- [ ] Performance optimized

### **Post-Deployment**
- [ ] PWA installs correctly
- [ ] All authentication flows work
- [ ] Database connections stable
- [ ] File uploads functional
- [ ] Email notifications working
- [ ] Push notifications enabled

## 🔍 **Debugging Tips**

### **Common Issues**
1. **Theme not switching**: Check if ThemeProvider is properly wrapped
2. **PWA not installing**: Verify manifest.json and service worker
3. **Authentication failing**: Check NextAuth configuration
4. **Database errors**: Verify Prisma schema and connection

### **Browser DevTools**
- Check Console for JavaScript errors
- Network tab for API call failures
- Application tab for PWA status
- Lighthouse for PWA audit

The CareBridge platform is fully functional and ready for comprehensive testing across all features and user roles!
