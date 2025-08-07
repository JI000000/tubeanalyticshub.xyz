#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * E2E Test Runner Script
 * Handles test execution with proper setup and teardown
 */

const config = {
  // Test environment configuration
  testTimeout: 30000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Browser configuration
  browsers: ['chromium', 'firefox', 'webkit'],
  mobileDevices: ['Mobile Chrome', 'Mobile Safari'],
  
  // Test categories
  testSuites: {
    smoke: ['new-user-experience.spec.ts'],
    auth: ['social-login-flows.spec.ts', 'anonymous-to-login-conversion.spec.ts'],
    mobile: ['mobile-login-experience.spec.ts'],
    errors: ['error-scenarios.spec.ts'],
    complete: ['complete-user-journey.spec.ts'],
    all: ['*.spec.ts']
  }
};

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function executeCommand(command, options = {}) {
  try {
    log(`Executing: ${command}`);
    const result = execSync(command, {
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options
    });
    return { success: true, result };
  } catch (error) {
    log(`Command failed: ${error.message}`, 'error');
    return { success: false, error };
  }
}

function checkPrerequisites() {
  log('Checking prerequisites...');
  
  // Check if Playwright is installed
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    log('Playwright is installed');
  } catch (error) {
    log('Playwright not found, installing...', 'warn');
    executeCommand('npm install @playwright/test playwright');
    executeCommand('npx playwright install');
  }
  
  // Check if Next.js app can start
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('package.json not found', 'error');
    process.exit(1);
  }
  
  log('Prerequisites check completed');
}

function setupTestEnvironment() {
  log('Setting up test environment...');
  
  // Create test results directory
  const resultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-e2e-tests';
  
  log('Test environment setup completed');
}

function runTestSuite(suite = 'all', options = {}) {
  log(`Running test suite: ${suite}`);
  
  const testFiles = config.testSuites[suite] || [suite];
  const testPattern = testFiles.join(' ');
  
  let command = `npx playwright test ${testPattern}`;
  
  // Add options
  if (options.headed) command += ' --headed';
  if (options.debug) command += ' --debug';
  if (options.ui) command += ' --ui';
  if (options.browser) command += ` --project=${options.browser}`;
  if (options.grep) command += ` --grep="${options.grep}"`;
  
  // Add CI-specific options
  if (process.env.CI) {
    command += ' --reporter=github';
  } else {
    command += ' --reporter=html';
  }
  
  const result = executeCommand(command);
  
  if (result.success) {
    log(`Test suite '${suite}' completed successfully`);
  } else {
    log(`Test suite '${suite}' failed`, 'error');
    if (!options.continueOnFailure) {
      process.exit(1);
    }
  }
  
  return result;
}

function generateTestReport() {
  log('Generating test report...');
  
  const reportCommand = 'npx playwright show-report --host=0.0.0.0';
  
  if (process.env.CI) {
    log('Skipping interactive report in CI environment');
    return;
  }
  
  log('Test report will be available at: http://localhost:9323');
  executeCommand(reportCommand);
}

function cleanupTestEnvironment() {
  log('Cleaning up test environment...');
  
  // Clean up any test artifacts
  const artifactsDir = path.join(process.cwd(), 'test-results');
  if (fs.existsSync(artifactsDir)) {
    const files = fs.readdirSync(artifactsDir);
    log(`Found ${files.length} test artifacts`);
  }
  
  log('Cleanup completed');
}

function main() {
  const args = process.argv.slice(2);
  const options = {};
  let suite = 'smoke'; // Default to smoke tests
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--suite':
        suite = args[++i];
        break;
      case '--headed':
        options.headed = true;
        break;
      case '--debug':
        options.debug = true;
        break;
      case '--ui':
        options.ui = true;
        break;
      case '--browser':
        options.browser = args[++i];
        break;
      case '--grep':
        options.grep = args[++i];
        break;
      case '--continue-on-failure':
        options.continueOnFailure = true;
        break;
      case '--help':
        console.log(`
E2E Test Runner

Usage: node scripts/run-e2e-tests.js [options]

Options:
  --suite <name>           Test suite to run (smoke, auth, mobile, errors, complete, all)
  --headed                 Run tests in headed mode
  --debug                  Run tests in debug mode
  --ui                     Run tests in UI mode
  --browser <name>         Run tests on specific browser
  --grep <pattern>         Run tests matching pattern
  --continue-on-failure    Continue running other suites on failure
  --help                   Show this help message

Available test suites:
  smoke    - Basic functionality tests
  auth     - Authentication flow tests
  mobile   - Mobile experience tests
  errors   - Error handling tests
  complete - Complete user journey tests
  all      - All test suites

Examples:
  node scripts/run-e2e-tests.js --suite smoke
  node scripts/run-e2e-tests.js --suite auth --headed
  node scripts/run-e2e-tests.js --suite mobile --browser "Mobile Chrome"
  node scripts/run-e2e-tests.js --grep "login" --debug
        `);
        process.exit(0);
        break;
      default:
        if (!arg.startsWith('--')) {
          suite = arg;
        }
        break;
    }
  }
  
  log('Starting E2E test execution...');
  log(`Suite: ${suite}`);
  log(`Options: ${JSON.stringify(options, null, 2)}`);
  
  try {
    checkPrerequisites();
    setupTestEnvironment();
    
    const result = runTestSuite(suite, options);
    
    if (result.success && !options.debug && !options.ui) {
      generateTestReport();
    }
    
    cleanupTestEnvironment();
    
    log('E2E test execution completed successfully');
    process.exit(0);
    
  } catch (error) {
    log(`E2E test execution failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('Received SIGINT, cleaning up...', 'warn');
  cleanupTestEnvironment();
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, cleaning up...', 'warn');
  cleanupTestEnvironment();
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = {
  runTestSuite,
  checkPrerequisites,
  setupTestEnvironment,
  cleanupTestEnvironment
};