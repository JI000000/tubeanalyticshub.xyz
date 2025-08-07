#!/usr/bin/env node

/**
 * Verification script for NextAuth.js dependencies and configuration
 * This script checks that all required packages are installed and environment variables are configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying NextAuth.js setup...\n');

// Check if package.json exists and has required dependencies
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

// Required dependencies
const requiredDeps = [
  'next-auth',
  '@next-auth/supabase-adapter',
  '@fingerprintjs/fingerprintjs',
  'js-cookie',
  '@types/js-cookie'
];

console.log('📦 Checking dependencies:');
let allDepsInstalled = true;

requiredDeps.forEach(dep => {
  if (dependencies[dep]) {
    console.log(`✅ ${dep} - ${dependencies[dep]}`);
  } else {
    console.log(`❌ ${dep} - NOT INSTALLED`);
    allDepsInstalled = false;
  }
});

if (!allDepsInstalled) {
  console.error('\n❌ Some required dependencies are missing. Please run:');
  console.error('npm install next-auth @next-auth/supabase-adapter @fingerprintjs/fingerprintjs js-cookie @types/js-cookie');
  process.exit(1);
}

// Check environment files
console.log('\n🔧 Checking environment configuration:');

const envFiles = [
  { name: '.env.example', path: path.join(__dirname, '..', '.env.example') },
  { name: '.env.local', path: path.join(__dirname, '..', '.env.local') },
  { name: '.env.production', path: path.join(__dirname, '..', '.env.production') }
];

const requiredEnvVars = [
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GITHUB_ID',
  'GITHUB_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

envFiles.forEach(envFile => {
  if (fs.existsSync(envFile.path)) {
    console.log(`\n📄 ${envFile.name}:`);
    const envContent = fs.readFileSync(envFile.path, 'utf8');
    
    requiredEnvVars.forEach(envVar => {
      if (envContent.includes(`${envVar}=`)) {
        const line = envContent.split('\n').find(line => line.startsWith(`${envVar}=`));
        const value = line ? line.split('=')[1] : '';
        
        if (value && !value.startsWith('your_') && value !== '') {
          console.log(`  ✅ ${envVar} - configured`);
        } else {
          console.log(`  ⚠️  ${envVar} - needs configuration`);
        }
      } else {
        console.log(`  ❌ ${envVar} - missing`);
      }
    });
  } else {
    console.log(`❌ ${envFile.name} - not found`);
  }
});

// Check if Supabase configuration exists
console.log('\n🗄️  Checking Supabase configuration:');
const supabaseVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  
  supabaseVars.forEach(envVar => {
    if (envContent.includes(`${envVar}=`)) {
      console.log(`  ✅ ${envVar} - configured`);
    } else {
      console.log(`  ❌ ${envVar} - missing`);
    }
  });
} else {
  console.log('  ❌ .env.local not found');
}

console.log('\n📚 Next steps:');
console.log('1. Configure OAuth applications (see docs/OAUTH_SETUP.md)');
console.log('2. Update environment variables with actual OAuth credentials');
console.log('3. Run: npm run dev to test the setup');
console.log('4. Proceed to Task 2: Create NextAuth.js configuration');

console.log('\n✅ Dependency verification complete!');