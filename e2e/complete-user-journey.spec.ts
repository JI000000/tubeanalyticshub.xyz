import { test, expect, AuthHelpers } from './fixtures/auth-fixtures';
import { MockAuthServer } from './test-utils/mock-server';

test.describe('Complete User Journey Tests', () => {
  let authHelpers: AuthHelpers;
  let mockServer: MockAuthServer;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    mockServer = new MockAuthServer(page);
    
    // Clear storage for fresh start
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Setup analytics tracking
    await mockServer.setupAnalyticsTracking();
  });

  test('complete new user journey: anonymous → trial → login → authenticated', async ({ page }) => {
    // Setup mocks
    await mockServer.mockTrialAPI();
    await mockServer.mockSuccessfulGitHubAuth();
    await mockServer.mockAnalyticsAPI();
    
    // Step 1: Anonymous user arrives
    await page.goto('/');
    
    // Should see trial status
    await expect(page.locator('[data-testid="trial-status-indicator"]')).toContainText('5');
    
    // Step 2: Use trial features
    await page.click('[data-testid="analyze-video-button"]');
    await page.waitForTimeout(1000);
    
    // Trial should be consumed
    await expect(page.locator('[data-testid="trial-status-indicator"]')).toContainText('4');
    
    // Step 3: Continue using trials
    for (let i = 0; i < 3; i++) {
      await page.click('[data-testid="analyze-video-button"]');
      await page.waitForTimeout(500);
    }
    
    // Should have 1 trial left
    await expect(page.locator('[data-testid="trial-status-indicator"]')).toContainText('1');
    await expect(page.locator('[data-testid="trial-urgent-warning"]')).toBeVisible();
    
    // Step 4: Try to save (requires login)
    await page.click('[data-testid="save-report-button"]');
    
    // Should show login modal
    const modal = await authHelpers.waitForLoginModal();
    await expect(modal).toContainText('保存功能需要登录');
    
    // Step 5: Login with GitHub
    await page.click('[data-testid="social-login-github"]');
    
    // Should redirect to GitHub
    await page.waitForURL('**/github.com/login/oauth/authorize**', { timeout: 5000 });
    
    // Simulate successful OAuth return
    await page.goto('/?login=success');
    
    // Step 6: Should be authenticated
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).not.toBeVisible();
    
    // Should show unlimited access
    await expect(page.locator('[data-testid="unlimited-access-badge"]')).toBeVisible();
    
    // Step 7: Should be able to save now
    await page.click('[data-testid="save-report-button"]');
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();
    
    // Verify analytics events
    const events = await mockServer.getAnalyticsEvents();
    expect(events.some(e => e.event === 'trial_consumed')).toBeTruthy();
    expect(events.some(e => e.event === 'login_prompt_shown')).toBeTruthy();
    expect(events.some(e => e.event === 'login_success')).toBeTruthy();
  });

  test('user journey with trial exhaustion', async ({ page }) => {
    await mockServer.mockTrialAPI();
    await mockServer.mockSuccessfulGoogleAuth();
    
    await page.goto('/');
    
    // Exhaust all trials
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="analyze-video-button"]');
      await page.waitForTimeout(300);
    }
    
    // Should show exhausted state
    await expect(page.locator('[data-testid="trial-status-indicator"]')).toContainText('0');
    
    // Try to use feature again
    await page.click('[data-testid="analyze-video-button"]');
    
    // Should show login modal with trial exhausted message
    const modal = await authHelpers.waitForLoginModal();
    await expect(modal).toContainText('试用次数已用完');
    await expect(modal).toContainText('登录获得更多权益');
    
    // Login with Google
    await page.click('[data-testid="social-login-google"]');
    await page.waitForURL('**/accounts.google.com/oauth/authorize**', { timeout: 5000 });
    
    // Return from OAuth
    await page.goto('/?login=success');
    
    // Should now have unlimited access
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    await page.click('[data-testid="analyze-video-button"]');
    await expect(page.locator('[data-testid="analysis-result"]')).toBeVisible();
  });

  test('user journey with multiple feature access attempts', async ({ page }) => {
    await mockServer.mockTrialAPI();
    await mockServer.mockSuccessfulGitHubAuth();
    
    await page.goto('/');
    
    // Try multiple features requiring login
    const features = [
      { button: '[data-testid="save-report-button"]', message: '保存功能需要登录' },
      { button: '[data-testid="export-data-button"]', message: '数据导出需要登录' },
      { button: '[data-testid="team-feature-button"]', message: '团队协作功能需要登录' },
      { button: '[data-testid="history-button"]', message: '访问历史记录需要登录' }
    ];
    
    for (const feature of features) {
      // Try feature
      await page.click(feature.button);
      
      // Should show appropriate login prompt
      const modal = await authHelpers.waitForLoginModal();
      await expect(modal).toContainText(feature.message);
      
      // Close modal to try next feature
      await page.click('[data-testid="modal-close"]');
      await page.waitForTimeout(500);
    }
    
    // Finally login
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    await page.click('[data-testid="social-login-github"]');
    await page.waitForURL('**/github.com/login/oauth/authorize**');
    await page.goto('/?login=success');
    
    // All features should now be accessible
    for (const feature of features) {
      await page.click(feature.button);
      await expect(page.locator('[data-testid="feature-success"]')).toBeVisible();
      await page.waitForTimeout(300);
    }
  });

  test('user journey with error recovery', async ({ page }) => {
    await mockServer.mockTrialAPI();
    
    await page.goto('/');
    
    // Mock GitHub failure
    await page.route('**/api/auth/signin/github', route => route.abort('failed'));
    
    // Try to login with GitHub (fails)
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    await page.click('[data-testid="social-login-github"]');
    
    // Should show error
    await expect(page.locator('[data-testid="github-error"]')).toBeVisible();
    
    // Try Google instead
    await mockServer.mockSuccessfulGoogleAuth();
    await page.click('[data-testid="try-google-instead"]');
    await page.click('[data-testid="social-login-google"]');
    
    // Should succeed with Google
    await page.waitForURL('**/accounts.google.com/oauth/authorize**');
    await page.goto('/?login=success');
    
    // Should be authenticated
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('cross-device user journey simulation', async ({ page }) => {
    await mockServer.mockTrialAPI();
    await mockServer.mockSuccessfulGitHubAuth();
    
    // Simulate mobile device first
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Use some trials on mobile
    await page.click('[data-testid="analyze-video-button"]');
    await page.click('[data-testid="analyze-video-button"]');
    
    // Should have 3 trials left
    await expect(page.locator('[data-testid="trial-status-indicator"]')).toContainText('3');
    
    // Simulate switching to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    
    // Trial status should persist
    await expect(page.locator('[data-testid="trial-status-indicator"]')).toContainText('3');
    
    // Login on desktop
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    await page.click('[data-testid="social-login-github"]');
    await page.waitForURL('**/github.com/login/oauth/authorize**');
    await page.goto('/?login=success');
    
    // Should be authenticated
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    
    // Simulate back to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Should still be authenticated
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
  });

  test('user journey with session management', async ({ page }) => {
    await mockServer.mockSuccessfulGitHubAuth();
    
    await page.goto('/');
    
    // Login
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    await page.click('[data-testid="social-login-github"]');
    await page.waitForURL('**/github.com/login/oauth/authorize**');
    await page.goto('/?login=success');
    
    // Should be authenticated
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    
    // Simulate session expiry
    await page.route('**/api/auth/session', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'session_expired' })
      });
    });
    
    // Try to access protected feature
    await page.click('[data-testid="settings-button"]');
    
    // Should show session expired message
    await expect(page.locator('[data-testid="session-expired"]')).toBeVisible();
    
    // Should offer re-login
    await expect(page.locator('[data-testid="relogin-button"]')).toBeVisible();
    
    // Re-login
    await page.click('[data-testid="relogin-button"]');
    await authHelpers.waitForLoginModal();
    
    // Should show login options again
    await expect(page.locator('[data-testid="social-login-github"]')).toBeVisible();
  });

  test('user journey with progressive enhancement', async ({ page }) => {
    await mockServer.mockTrialAPI();
    
    await page.goto('/');
    
    // Start with basic features
    await expect(page.locator('[data-testid="basic-analysis"]')).toBeVisible();
    
    // Use trial
    await page.click('[data-testid="analyze-video-button"]');
    await expect(page.locator('[data-testid="trial-result"]')).toBeVisible();
    
    // Show premium features as locked
    await expect(page.locator('[data-testid="premium-feature-locked"]')).toBeVisible();
    
    // Try premium feature
    await page.click('[data-testid="premium-feature-button"]');
    const modal = await authHelpers.waitForLoginModal();
    await expect(modal).toContainText('高级功能需要登录');
    
    // Show benefits of premium
    await expect(modal).toContainText('解锁更多专业分析工具');
    await expect(page.locator('[data-testid="premium-benefits-list"]')).toBeVisible();
    
    // Login to unlock
    await mockServer.mockSuccessfulGitHubAuth();
    await page.click('[data-testid="social-login-github"]');
    await page.waitForURL('**/github.com/login/oauth/authorize**');
    await page.goto('/?login=success');
    
    // Premium features should now be available
    await expect(page.locator('[data-testid="premium-feature-unlocked"]')).toBeVisible();
    await page.click('[data-testid="premium-feature-button"]');
    await expect(page.locator('[data-testid="premium-analysis-result"]')).toBeVisible();
  });
});