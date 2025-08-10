#!/usr/bin/env node

/**
 * CareBridge Build Verification Script
 * Verifies that all build requirements are met
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 CareBridge Build Verification\n');

const checks = [
  {
    name: 'Package.json exists',
    check: () => fs.existsSync('package.json'),
    fix: 'Ensure package.json exists in the root directory'
  },
  {
    name: 'Prisma schema exists',
    check: () => fs.existsSync('prisma/schema.prisma'),
    fix: 'Ensure prisma/schema.prisma exists'
  },
  {
    name: 'Environment file exists',
    check: () => fs.existsSync('.env.local') || fs.existsSync('.env'),
    fix: 'Create .env.local with required environment variables'
  },
  {
    name: 'Node modules installed',
    check: () => fs.existsSync('node_modules'),
    fix: 'Run: npm install'
  },
  {
    name: 'Prisma client generated',
    check: () => {
      try {
        require('@prisma/client');
        return true;
      } catch {
        return false;
      }
    },
    fix: 'Run: npx prisma generate'
  },
  {
    name: 'TypeScript compiles',
    check: () => {
      try {
        execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    },
    fix: 'Fix TypeScript errors and run: npx tsc --noEmit'
  },
  {
    name: 'Next.js config exists',
    check: () => fs.existsSync('next.config.ts') || fs.existsSync('next.config.js'),
    fix: 'Ensure Next.js configuration file exists'
  },
  {
    name: 'PWA manifest exists',
    check: () => fs.existsSync('public/manifest.json'),
    fix: 'Ensure PWA manifest exists at public/manifest.json'
  },
  {
    name: 'Service worker exists',
    check: () => fs.existsSync('public/sw.js'),
    fix: 'Ensure service worker exists at public/sw.js'
  }
];

let allPassed = true;

checks.forEach((check, index) => {
  process.stdout.write(`${index + 1}. ${check.name}... `);
  
  try {
    if (check.check()) {
      console.log('✅ PASS');
    } else {
      console.log('❌ FAIL');
      console.log(`   Fix: ${check.fix}`);
      allPassed = false;
    }
  } catch (error) {
    console.log('❌ ERROR');
    console.log(`   Error: ${error.message}`);
    console.log(`   Fix: ${check.fix}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All checks passed! Ready to build.');
  console.log('\nTo build the application:');
  console.log('  npm run build');
  console.log('\nTo start development:');
  console.log('  npm run dev');
} else {
  console.log('⚠️  Some checks failed. Please fix the issues above.');
  console.log('\nCommon fixes:');
  console.log('  npm install              # Install dependencies');
  console.log('  npx prisma generate      # Generate Prisma client');
  console.log('  npx prisma db push       # Push schema to database');
  console.log('  cp .env.example .env.local # Create environment file');
}

console.log('\n📚 Documentation:');
console.log('  README.md                 # Main documentation');
console.log('  docs/BUILD-DEPLOYMENT.md  # Build and deployment guide');
console.log('  docs/16-WEEK-MILESTONES.md # Development milestones');
console.log('  docs/PWA-MOBILE-IMPLEMENTATION.md # PWA and mobile guide');

process.exit(allPassed ? 0 : 1);
