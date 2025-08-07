import { test, expect, AuthHelpers } from './fixtures/auth-fixtures';

test.describe('Error Scenarios and Recovery', () => {
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

  test.describe('Network Errors', () => {
    test('should handle complete network failure', async ({ page }) => {
      await page.goto('/');
      
      // Mock complete network failure
      await page.route('**/*', route => route.abort('failed'));
      
      // Try to trigger login
      await page.click('[data-testid="save-report-button"]');
      
      // Should show network error message
      await expect(page.locator('[data-testid="network-error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="network-error-message"]')).toContainText('网络连接失败');
    });

    test('should retry failed requests automatically', async ({ page }) => {
      await page.goto('/');
      
      let attemptCount = 0;
      await page.route('**/api/auth/signin/github', async route => {
        attemptCount++;
        if (attemptCount <= 2) {
          await route.abort('failed');
        } else {
          await route.fulfill({
            status: 302,
            headers: { 'Location': 'https://github.com/login/oauth/authorize' }
          });
        }
      });
      
      // Trigger login
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      await page.click('[data-testid="social-login-github"]');
      
      // Should eventually succeed after retries
      await page.waitForURL('**/github.com/login/oauth/authorize**', { timeout: 10000 });
      expect(attemptCount).toBe(3);
    });

    test('should show retry button after max retries', async ({ page }) => {
      await page.goto('/');
      
      // Mock persistent failure
      await page.route('**/api/auth/signin/github', route => route.abort('failed'));
      
      // Trigger login
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      await page.click('[data-testid="social-login-github"]');
      
      // Should show retry option after failures
      await expect(page.locator('[data-testid="retry-login-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="network-error"]')).toContainText('连接失败，请重试');
    });

    test('should handle slow network responses', async ({ page }) => {
      await page.goto('/');
      
      // Mock very slow response
      await page.route('**/api/auth/signin/github', async route => {
        await new Promise(resolve => setTimeout(resolve, 10000));
        await route.fulfill({ status: 302, headers: { 'Location': 'https://github.com' } });
      });
      
      // Trigger login
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      await page.click('[data-testid="social-login-github"]');
      
      // Should show timeout warning
      await expect(page.locator('[data-testid="slow-connection-warning"]')).toBeVisible();
      
      // Should offer cancel option
      await expect(page.locator('[data-testid="cancel-login-button"]')).toBeVisible();
    });
  });

  test.describe('OAuth Provider Errors', () => {
    test('should handle GitHub OAuth errors', async ({ page }) => {
      await page.goto('/');
      
      // Mock GitHub OAuth error
      await page.route('**/api/auth/callback/github**', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'access_denied',
            error_description: 'The user denied the request'
          })
        });
      });
      
      // Simulate OAuth callback with error
      await page.goto('/api/auth/callback/github?error=access_denied&error_description=The%20user%20denied%20the%20request');
      
      // Should show user-friendly error
      await expect(page.locator('[data-testid="oauth-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="oauth-error"]')).toContainText('GitHub 登录被取消');
      
      // Should offer alternative login methods
      await expect(page.locator('[data-testid="try-google-login"]')).toBeVisible();
      await expect(page.locator('[data-testid="try-email-login"]')).toBeVisible();
    });

    test('should handle Google OAuth errors', async ({ page }) => {
      await page.goto('/');
      
      // Mock Google OAuth error
      await page.route('**/api/auth/callback/google**', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'invalid_grant',
            error_description: 'Invalid authorization code'
          })
        });
      });
      
      // Simulate OAuth callback with error
      await page.goto('/api/auth/callback/google?error=invalid_grant');
      
      // Should show appropriate error message
      await expect(page.locator('[data-testid="oauth-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="oauth-error"]')).toContainText('Google 登录失败');
      
      // Should suggest retry
      await expect(page.locator('[data-testid="retry-google-login"]')).toBeVisible();
    });

    test('should handle OAuth state mismatch', async ({ page }) => {
      await page.goto('/');
      
      // Mock state mismatch error
      await page.route('**/api/auth/callback/github**', async route => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'state_mismatch',
            error_description: 'State parameter mismatch'
          })
        });
      });
      
      // Simulate callback with state mismatch
      await page.goto('/api/auth/callback/github?code=test&state=invalid');
      
      // Should show security error
      await expect(page.locator('[data-testid="security-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="security-error"]')).toContainText('安全验证失败');
      
      // Should suggest starting over
      await expect(page.locator('[data-testid="restart-login-button"]')).toBeVisible();
    });

    test('should handle expired OAuth sessions', async ({ page }) => {
      await page.goto('/');
      
      // Mock expired session
      await page.route('**/api/auth/session', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'session_expired',
            message: 'Session has expired'
          })
        });
      });
      
      // Try to access authenticated content
      await page.goto('/en/settings');
      
      // Should show session expired message
      await expect(page.locator('[data-testid="session-expired"]')).toBeVisible();
      await expect(page.locator('[data-testid="session-expired"]')).toContainText('登录已过期');
      
      // Should offer re-login
      await expect(page.locator('[data-testid="relogin-button"]')).toBeVisible();
    });
  });

  test.describe('Server Errors', () => {
    test('should handle 500 server errors', async ({ page }) => {
      await page.goto('/');
      
      // Mock server error
      await page.route('**/api/auth/signin/github', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'internal_server_error',
            message: 'Internal server error'
          })
        });
      });
      
      // Trigger login
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      await page.click('[data-testid="social-login-github"]');
      
      // Should show server error message
      await expect(page.locator('[data-testid="server-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="server-error"]')).toContainText('服务器暂时不可用');
      
      // Should offer alternative actions
      await expect(page.locator('[data-testid="try-later-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="contact-support-button"]')).toBeVisible();
    });

    test('should handle rate limiting', async ({ page }) => {
      await page.goto('/');
      
      // Mock rate limit error
      await page.route('**/api/auth/signin/github', async route => {
        await route.fulfill({
          status: 429,
          headers: {
            'Retry-After': '60'
          },
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'rate_limit_exceeded',
            message: 'Too many requests',
            retryAfter: 60
          })
        });
      });
      
      // Trigger login
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      await page.click('[data-testid="social-login-github"]');
      
      // Should show rate limit message
      await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="rate-limit-error"]')).toContainText('请求过于频繁');
      await expect(page.locator('[data-testid="rate-limit-error"]')).toContainText('60秒后重试');
    });

    test('should handle database connection errors', async ({ page }) => {
      await page.goto('/');
      
      // Mock database error
      await page.route('**/api/trial/consume', async route => {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'database_unavailable',
            message: 'Database connection failed'
          })
        });
      });
      
      // Try to consume trial
      await page.click('[data-testid="analyze-video-button"]');
      
      // Should show database error
      await expect(page.locator('[data-testid="database-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="database-error"]')).toContainText('数据服务暂时不可用');
      
      // Should offer offline mode
      await expect(page.locator('[data-testid="offline-mode-button"]')).toBeVisible();
    });
  });

  test.describe('Client-Side Errors', () => {
    test('should handle JavaScript errors gracefully', async ({ page }) => {
      await page.goto('/');
      
      // Inject JavaScript error
      await page.addInitScript(() => {
        window.addEventListener('load', () => {
          // Simulate error in auth code
          throw new Error('Simulated auth error');
        });
      });
      
      // Should still show basic functionality
      await expect(page.locator('body')).toBeVisible();
      
      // Should show error boundary
      await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-boundary"]')).toContainText('出现了一些问题');
    });

    test('should handle localStorage quota exceeded', async ({ page }) => {
      await page.goto('/');
      
      // Mock localStorage quota exceeded
      await page.addInitScript(() => {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
          if (key === 'trial_status') {
            throw new Error('QuotaExceededError');
          }
          return originalSetItem.call(this, key, value);
        };
      });
      
      // Try to use trial feature
      await page.click('[data-testid="analyze-video-button"]');
      
      // Should handle storage error gracefully
      await expect(page.locator('[data-testid="storage-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="storage-error"]')).toContainText('存储空间不足');
      
      // Should offer alternative (login)
      await expect(page.locator('[data-testid="login-instead-button"]')).toBeVisible();
    });

    test('should handle cookie disabled scenarios', async ({ page }) => {
      // Disable cookies
      await page.context().clearCookies();
      await page.addInitScript(() => {
        Object.defineProperty(document, 'cookie', {
          get: () => '',
          set: () => false
        });
      });
      
      await page.goto('/');
      
      // Should detect cookies disabled
      await expect(page.locator('[data-testid="cookies-disabled-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="cookies-disabled-warning"]')).toContainText('需要启用Cookie');
      
      // Should provide instructions
      await expect(page.locator('[data-testid="enable-cookies-help"]')).toBeVisible();
    });
  });

  test.describe('Recovery Mechanisms', () => {
    test('should provide fallback login methods', async ({ page }) => {
      await page.goto('/');
      
      // Mock GitHub failure
      await page.route('**/api/auth/signin/github', route => route.abort('failed'));
      
      // Trigger login and fail GitHub
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      await page.click('[data-testid="social-login-github"]');
      
      // Should show error and alternatives
      await expect(page.locator('[data-testid="github-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="try-google-instead"]')).toBeVisible();
      await expect(page.locator('[data-testid="try-email-instead"]')).toBeVisible();
      
      // Should be able to try Google
      await page.click('[data-testid="try-google-instead"]');
      await expect(page.locator('[data-testid="social-login-google"]')).toBeVisible();
    });

    test('should allow graceful degradation', async ({ page }) => {
      await page.goto('/');
      
      // Mock all auth services failing
      await page.route('**/api/auth/**', route => route.abort('failed'));
      
      // Try to access feature requiring auth
      await page.click('[data-testid="save-report-button"]');
      
      // Should offer limited functionality
      await expect(page.locator('[data-testid="limited-mode-offer"]')).toBeVisible();
      await expect(page.locator('[data-testid="limited-mode-offer"]')).toContainText('以访客模式继续');
      
      // Should explain limitations
      await expect(page.locator('[data-testid="guest-mode-limitations"]')).toBeVisible();
    });

    test('should provide contact support option', async ({ page }) => {
      await page.goto('/');
      
      // Mock persistent errors
      await page.route('**/api/auth/**', route => route.abort('failed'));
      
      // Try multiple login methods
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      await page.click('[data-testid="social-login-github"]');
      await page.waitForTimeout(2000);
      
      await page.click('[data-testid="social-login-google"]');
      await page.waitForTimeout(2000);
      
      // Should show support contact after multiple failures
      await expect(page.locator('[data-testid="contact-support"]')).toBeVisible();
      await expect(page.locator('[data-testid="contact-support"]')).toContainText('联系技术支持');
      
      // Should provide error details for support
      await expect(page.locator('[data-testid="error-details"]')).toBeVisible();
    });

    test('should handle partial system recovery', async ({ page }) => {
      await page.goto('/');
      
      let githubFixed = false;
      await page.route('**/api/auth/signin/github', async route => {
        if (githubFixed) {
          await route.fulfill({
            status: 302,
            headers: { 'Location': 'https://github.com/login/oauth/authorize' }
          });
        } else {
          await route.abort('failed');
        }
      });
      
      // Initial failure
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      await page.click('[data-testid="social-login-github"]');
      
      await expect(page.locator('[data-testid="github-error"]')).toBeVisible();
      
      // Fix the service
      githubFixed = true;
      
      // Retry should work
      await page.click('[data-testid="retry-github-login"]');
      await page.waitForURL('**/github.com/login/oauth/authorize**', { timeout: 5000 });
    });
  });
});