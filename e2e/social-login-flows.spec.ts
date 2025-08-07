import { test, expect, AuthHelpers } from './fixtures/auth-fixtures';

test.describe('Social Login Flows', () => {
  let authHelpers: AuthHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
    
    // Clear storage
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should display GitHub login option', async ({ page }) => {
    await page.goto('/');
    
    // Trigger login modal
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    
    // Should show GitHub login button
    const githubButton = page.locator('[data-testid="social-login-github"]');
    await expect(githubButton).toBeVisible();
    await expect(githubButton).toContainText('GitHub');
    
    // Should have GitHub icon
    await expect(githubButton.locator('svg')).toBeVisible();
  });

  test('should display Google login option', async ({ page }) => {
    await page.goto('/');
    
    // Trigger login modal
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    
    // Should show Google login button
    const googleButton = page.locator('[data-testid="social-login-google"]');
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toContainText('Google');
    
    // Should have Google icon
    await expect(googleButton.locator('svg')).toBeVisible();
  });

  test('should handle GitHub OAuth flow initiation', async ({ page }) => {
    await page.goto('/');
    
    // Mock OAuth redirect
    await page.route('**/api/auth/signin/github', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': 'https://github.com/login/oauth/authorize?client_id=test&redirect_uri=http://localhost:3000/api/auth/callback/github'
        }
      });
    });
    
    // Trigger login modal and click GitHub
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    
    // Click GitHub login
    await page.click('[data-testid="social-login-github"]');
    
    // Should redirect to GitHub OAuth
    await page.waitForURL('**/github.com/login/oauth/authorize**', { timeout: 5000 });
  });

  test('should handle Google OAuth flow initiation', async ({ page }) => {
    await page.goto('/');
    
    // Mock OAuth redirect
    await page.route('**/api/auth/signin/google', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': 'https://accounts.google.com/oauth/authorize?client_id=test&redirect_uri=http://localhost:3000/api/auth/callback/google'
        }
      });
    });
    
    // Trigger login modal and click Google
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    
    // Click Google login
    await page.click('[data-testid="social-login-google"]');
    
    // Should redirect to Google OAuth
    await page.waitForURL('**/accounts.google.com/oauth/authorize**', { timeout: 5000 });
  });

  test('should show loading state during OAuth flow', async ({ page }) => {
    await page.goto('/');
    
    // Mock slow OAuth response
    await page.route('**/api/auth/signin/github', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 302,
        headers: {
          'Location': 'https://github.com/login/oauth/authorize?client_id=test'
        }
      });
    });
    
    // Trigger login and click GitHub
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    await page.click('[data-testid="social-login-github"]');
    
    // Should show loading state
    await expect(page.locator('[data-testid="oauth-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="social-login-github"]')).toBeDisabled();
  });

  test('should handle successful OAuth callback', async ({ page }) => {
    await page.goto('/');
    
    // Mock successful OAuth callback
    await page.route('**/api/auth/callback/github**', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/?login=success'
        }
      });
    });
    
    // Mock session endpoint
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            image: 'https://avatars.githubusercontent.com/u/12345'
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });
    
    // Simulate OAuth callback
    await page.goto('/?login=success');
    
    // Should show authenticated state
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-button"]')).not.toBeVisible();
  });

  test('should handle OAuth errors gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Mock OAuth error
    await page.route('**/api/auth/signin/github', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'OAuth provider error',
          message: 'GitHub authentication failed'
        })
      });
    });
    
    // Trigger login and click GitHub
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    await page.click('[data-testid="social-login-github"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="oauth-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="oauth-error"]')).toContainText('GitHub authentication failed');
    
    // Should offer alternative login methods
    await expect(page.locator('[data-testid="social-login-google"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-login-fallback"]')).toBeVisible();
  });

  test('should handle network errors during OAuth', async ({ page }) => {
    await page.goto('/');
    
    // Mock network error
    await page.route('**/api/auth/signin/github', async route => {
      await route.abort('failed');
    });
    
    // Trigger login and click GitHub
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    await page.click('[data-testid="social-login-github"]');
    
    // Should show network error
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-login-button"]')).toBeVisible();
  });

  test('should retry failed OAuth attempts', async ({ page }) => {
    await page.goto('/');
    
    let attemptCount = 0;
    await page.route('**/api/auth/signin/github', async route => {
      attemptCount++;
      if (attemptCount === 1) {
        await route.abort('failed');
      } else {
        await route.fulfill({
          status: 302,
          headers: {
            'Location': 'https://github.com/login/oauth/authorize?client_id=test'
          }
        });
      }
    });
    
    // Trigger login and click GitHub (first attempt fails)
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    await page.click('[data-testid="social-login-github"]');
    
    // Should show error and retry button
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    
    // Click retry
    await page.click('[data-testid="retry-login-button"]');
    
    // Should succeed on second attempt
    await page.waitForURL('**/github.com/login/oauth/authorize**', { timeout: 5000 });
  });

  test('should continue previous action after successful login', async ({ page }) => {
    await page.goto('/');
    
    // Mock successful login flow
    await page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User'
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });
    
    // Trigger save action (which requires login)
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    
    // Simulate successful login
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('auth-success', {
        detail: {
          user: { id: 'test-user-id', email: 'test@example.com' },
          returnAction: 'save_report'
        }
      }));
    });
    
    // Should close modal and continue with save action
    await expect(page.locator('[data-testid="smart-login-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="save-success-message"]')).toBeVisible();
  });

  test('should track social login conversion rates', async ({ page }) => {
    await page.goto('/');
    
    // Mock analytics
    await page.addInitScript(() => {
      window.analyticsEvents = [];
      window.trackEvent = (event, data) => {
        window.analyticsEvents.push({ event, data, timestamp: Date.now() });
      };
    });
    
    // Trigger login and attempt GitHub login
    await page.click('[data-testid="save-report-button"]');
    await authHelpers.waitForLoginModal();
    await page.click('[data-testid="social-login-github"]');
    
    // Check analytics events
    const events = await page.evaluate(() => window.analyticsEvents);
    expect(events.some(e => e.event === 'login_attempt' && e.data.provider === 'github')).toBeTruthy();
  });
});