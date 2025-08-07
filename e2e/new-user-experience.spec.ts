import { test, expect, AuthHelpers } from './fixtures/auth-fixtures';

test.describe('New User First Visit Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage to simulate first-time visitor
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should allow anonymous browsing of public content', async ({ page }) => {
    const authHelpers = new AuthHelpers(page);
    
    await page.goto('/');
    
    // Should see main content without login requirement
    await expect(page.locator('h1')).toBeVisible();
    
    // Should see trial status indicator
    await expect(page.locator('[data-testid="trial-status-indicator"]')).toBeVisible();
    
    // Should not see user profile
    await expect(page.locator('[data-testid="user-profile"]')).not.toBeVisible();
    
    // Should see login button in navigation
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test('should display feature access indicators', async ({ page }) => {
    await page.goto('/');
    
    // Should see locked features with visual indicators
    const lockedFeatures = page.locator('[data-testid^="feature-locked-"]');
    await expect(lockedFeatures.first()).toBeVisible();
    
    // Should show "Login required" tooltips on hover
    await lockedFeatures.first().hover();
    await expect(page.locator('[data-testid="login-required-tooltip"]')).toBeVisible();
  });

  test('should initialize trial status for new user', async ({ page }) => {
    await page.goto('/');
    
    // Wait for trial initialization
    await page.waitForTimeout(1000);
    
    // Should show initial trial count (5 trials)
    const trialIndicator = page.locator('[data-testid="trial-status-indicator"]');
    await expect(trialIndicator).toContainText('5');
    
    // Should show trial explanation
    await expect(page.locator('[data-testid="trial-explanation"]')).toBeVisible();
  });

  test('should allow trial consumption for core features', async ({ page }) => {
    await page.goto('/');
    
    // Click on a feature that allows trial usage
    await page.click('[data-testid="analyze-video-button"]');
    
    // Should consume one trial
    await page.waitForTimeout(1000);
    const trialIndicator = page.locator('[data-testid="trial-status-indicator"]');
    await expect(trialIndicator).toContainText('4');
    
    // Should show updated trial status
    await expect(page.locator('[data-testid="trial-consumed-message"]')).toBeVisible();
  });

  test('should show progressive login hints as trials decrease', async ({ page }) => {
    await page.goto('/');
    
    // Simulate having 2 trials left
    await page.evaluate(() => {
      localStorage.setItem('trial_status', JSON.stringify({
        remaining: 2,
        total: 5,
        fingerprint: 'test-fingerprint',
        lastUsed: new Date().toISOString(),
        actions: []
      }));
    });
    
    await page.reload();
    
    // Should show "2 trials left" message
    await expect(page.locator('[data-testid="trial-warning"]')).toContainText('2');
    
    // Should show login benefits
    await expect(page.locator('[data-testid="login-benefits"]')).toBeVisible();
  });

  test('should handle browser fingerprinting for trial tracking', async ({ page }) => {
    await page.goto('/');
    
    // Wait for fingerprint generation
    await page.waitForTimeout(2000);
    
    // Check that fingerprint was generated and stored
    const fingerprint = await page.evaluate(() => {
      const trialData = localStorage.getItem('trial_status');
      return trialData ? JSON.parse(trialData).fingerprint : null;
    });
    
    expect(fingerprint).toBeTruthy();
    expect(typeof fingerprint).toBe('string');
    expect(fingerprint.length).toBeGreaterThan(10);
  });

  test('should persist trial status across page reloads', async ({ page }) => {
    await page.goto('/');
    
    // Consume a trial
    await page.click('[data-testid="analyze-video-button"]');
    await page.waitForTimeout(1000);
    
    // Reload page
    await page.reload();
    
    // Trial count should persist
    const trialIndicator = page.locator('[data-testid="trial-status-indicator"]');
    await expect(trialIndicator).toContainText('4');
  });

  test('should show contextual help for new users', async ({ page }) => {
    await page.goto('/');
    
    // Should show onboarding hints
    await expect(page.locator('[data-testid="new-user-hint"]')).toBeVisible();
    
    // Should show feature explanations
    await expect(page.locator('[data-testid="feature-explanation"]')).toBeVisible();
    
    // Should show trial system explanation
    await expect(page.locator('[data-testid="trial-system-help"]')).toBeVisible();
  });
});