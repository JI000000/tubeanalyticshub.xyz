import { test, expect, AuthHelpers } from './fixtures/auth-fixtures';

test.describe('Anonymous Trial to Login Conversion', () => {
  let authHelpers: AuthHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    
    // Clear storage for fresh start
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should trigger login prompt when trials are exhausted', async ({ page }) => {
    await page.goto('/');
    
    // Set trial status to 0 remaining
    await page.evaluate(() => {
      localStorage.setItem('trial_status', JSON.stringify({
        remaining: 0,
        total: 5,
        fingerprint: 'test-fingerprint',
        lastUsed: new Date().toISOString(),
        actions: []
      }));
    });
    
    await page.reload();
    
    // Try to use a feature
    await page.click('[data-testid="analyze-video-button"]');
    
    // Should show login modal with trial exhausted message
    const modal = await authHelpers.waitForLoginModal();
    await expect(modal).toContainText('试用次数已用完');
    await expect(modal).toContainText('登录获得更多权益');
  });

  test('should show progressive urgency as trials decrease', async ({ page }) => {
    await page.goto('/');
    
    // Test with 1 trial remaining
    await page.evaluate(() => {
      localStorage.setItem('trial_status', JSON.stringify({
        remaining: 1,
        total: 5,
        fingerprint: 'test-fingerprint',
        lastUsed: new Date().toISOString(),
        actions: []
      }));
    });
    
    await page.reload();
    
    // Should show high urgency warning
    await expect(page.locator('[data-testid="trial-urgent-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="trial-urgent-warning"]')).toContainText('最后1次');
    
    // Should show prominent login CTA
    await expect(page.locator('[data-testid="urgent-login-cta"]')).toBeVisible();
  });

  test('should handle save action requiring login', async ({ page }) => {
    await page.goto('/');
    
    // Try to save a report
    await page.click('[data-testid="save-report-button"]');
    
    // Should show login modal with save-specific message
    const modal = await authHelpers.waitForLoginModal();
    await expect(modal).toContainText('保存功能需要登录');
    await expect(modal).toContainText('登录后可以保存和管理您的分析报告');
  });

  test('should handle premium feature access', async ({ page }) => {
    await page.goto('/');
    
    // Try to access premium feature
    await page.click('[data-testid="premium-feature-button"]');
    
    // Should show login modal with premium feature message
    const modal = await authHelpers.waitForLoginModal();
    await expect(modal).toContainText('高级功能需要登录');
    await expect(modal).toContainText('解锁更多专业分析工具');
  });

  test('should handle data export requiring login', async ({ page }) => {
    await page.goto('/en/export');
    
    // Try to export data
    await page.click('[data-testid="export-data-button"]');
    
    // Should show login modal with export-specific message
    const modal = await authHelpers.waitForLoginModal();
    await expect(modal).toContainText('数据导出需要登录');
    await expect(modal).toContainText('确保数据安全和归属');
  });

  test('should show different login scenarios with appropriate messaging', async ({ page }) => {
    const scenarios = [
      {
        trigger: '[data-testid="history-button"]',
        expectedMessage: '访问历史记录需要登录'
      },
      {
        trigger: '[data-testid="favorites-button"]', 
        expectedMessage: '收藏功能需要登录'
      },
      {
        trigger: '[data-testid="team-feature-button"]',
        expectedMessage: '团队协作功能需要登录'
      }
    ];

    for (const scenario of scenarios) {
      await page.goto('/');
      await page.click(scenario.trigger);
      
      const modal = await authHelpers.waitForLoginModal();
      await expect(modal).toContainText(scenario.expectedMessage);
      
      // Close modal for next test
      await page.click('[data-testid="modal-close"]');
      await page.waitForTimeout(500);
    }
  });

  test('should track conversion funnel events', async ({ page }) => {
    await page.goto('/');
    
    // Mock analytics tracking
    await page.addInitScript(() => {
      window.analyticsEvents = [];
      window.trackEvent = (event, data) => {
        window.analyticsEvents.push({ event, data, timestamp: Date.now() });
      };
    });
    
    // Trigger login prompt
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    
    // Check that prompt_shown event was tracked
    const events = await page.evaluate(() => window.analyticsEvents);
    expect(events.some(e => e.event === 'login_prompt_shown')).toBeTruthy();
    expect(events.some(e => e.event === 'login_prompt_shown' && e.data.trigger === 'save_action')).toBeTruthy();
  });

  test('should allow skipping login for non-critical features', async ({ page }) => {
    await page.goto('/');
    
    // Trigger a skippable login prompt
    await page.click('[data-testid="optional-feature-button"]');
    
    const modal = await authHelpers.waitForLoginModal();
    
    // Should show skip option
    await expect(page.locator('[data-testid="skip-login-button"]')).toBeVisible();
    
    // Skip login
    await page.click('[data-testid="skip-login-button"]');
    
    // Modal should close
    await expect(modal).not.toBeVisible();
    
    // Should continue with limited functionality
    await expect(page.locator('[data-testid="limited-mode-notice"]')).toBeVisible();
  });

  test('should prevent skipping for critical features', async ({ page }) => {
    await page.goto('/');
    
    // Trigger a non-skippable login prompt
    await page.click('[data-testid="save-report-button"]');
    
    const modal = await authHelpers.waitForLoginModal();
    
    // Should not show skip option
    await expect(page.locator('[data-testid="skip-login-button"]')).not.toBeVisible();
    
    // Should show only login options
    await expect(page.locator('[data-testid="social-login-github"]')).toBeVisible();
    await expect(page.locator('[data-testid="social-login-google"]')).toBeVisible();
  });

  test('should show login benefits based on context', async ({ page }) => {
    const contexts = [
      {
        trigger: '[data-testid="save-report-button"]',
        expectedBenefit: '保存和管理分析报告'
      },
      {
        trigger: '[data-testid="team-feature-button"]',
        expectedBenefit: '团队协作和分享'
      },
      {
        trigger: '[data-testid="export-data-button"]',
        expectedBenefit: '导出和备份数据'
      }
    ];

    for (const context of contexts) {
      await page.goto('/');
      await page.click(context.trigger);
      
      const modal = await authHelpers.waitForLoginModal();
      await expect(modal).toContainText(context.expectedBenefit);
      
      // Close modal
      await page.click('[data-testid="modal-close"]');
      await page.waitForTimeout(500);
    }
  });

  test('should handle rapid feature access attempts', async ({ page }) => {
    await page.goto('/');
    
    // Rapidly click multiple features requiring login
    await page.click('[data-testid="save-report-button"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="export-data-button"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="team-feature-button"]');
    
    // Should only show one modal
    const modals = page.locator('[data-testid="smart-login-modal"]');
    await expect(modals).toHaveCount(1);
    
    // Should show the most recent context
    await expect(modals.first()).toContainText('团队协作');
  });
});