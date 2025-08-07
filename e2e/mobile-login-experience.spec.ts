import { test, expect, AuthHelpers } from './fixtures/auth-fixtures';

test.describe('Mobile Login Experience', () => {
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

  test.describe('Mobile Chrome', () => {
    test.use({ ...test.use(), ...require('@playwright/test').devices['Pixel 5'] });

    test('should display mobile-optimized login modal', async ({ page }) => {
      await page.goto('/');
      
      // Trigger login modal
      await page.click('[data-testid="save-report-button"]');
      const modal = await authHelpers.waitForLoginModal();
      
      // Should use bottom sheet layout on mobile
      await expect(modal).toHaveClass(/mobile-bottom-sheet/);
      
      // Should have appropriate mobile styling
      const modalRect = await modal.boundingBox();
      const viewportSize = page.viewportSize();
      
      // Should be full width on mobile
      expect(modalRect?.width).toBeCloseTo(viewportSize?.width || 0, 10);
      
      // Should be positioned at bottom
      expect(modalRect?.y).toBeGreaterThan((viewportSize?.height || 0) * 0.5);
    });

    test('should have touch-friendly button sizes', async ({ page }) => {
      await page.goto('/');
      
      // Trigger login modal
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      
      // Check social login button sizes
      const githubButton = page.locator('[data-testid="social-login-github"]');
      const buttonRect = await githubButton.boundingBox();
      
      // Should meet minimum touch target size (44px)
      expect(buttonRect?.height).toBeGreaterThanOrEqual(44);
      expect(buttonRect?.width).toBeGreaterThanOrEqual(44);
    });

    test('should handle mobile OAuth redirects', async ({ page }) => {
      await page.goto('/');
      
      // Mock mobile OAuth flow
      await page.route('**/api/auth/signin/github', async route => {
        await route.fulfill({
          status: 302,
          headers: {
            'Location': 'https://github.com/login/oauth/authorize?client_id=test&redirect_uri=http://localhost:3000/api/auth/callback/github'
          }
        });
      });
      
      // Trigger login and click GitHub
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      await page.click('[data-testid="social-login-github"]');
      
      // Should handle mobile redirect properly
      await page.waitForURL('**/github.com/login/oauth/authorize**', { timeout: 10000 });
      
      // Should maintain mobile viewport
      const viewportSize = page.viewportSize();
      expect(viewportSize?.width).toBeLessThanOrEqual(500);
    });

    test('should show mobile-specific loading states', async ({ page }) => {
      await page.goto('/');
      
      // Mock slow OAuth response
      await page.route('**/api/auth/signin/github', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({ status: 302, headers: { 'Location': 'https://github.com' } });
      });
      
      // Trigger login
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      await page.click('[data-testid="social-login-github"]');
      
      // Should show mobile loading indicator
      await expect(page.locator('[data-testid="mobile-oauth-loading"]')).toBeVisible();
      
      // Should disable interaction during loading
      await expect(page.locator('[data-testid="social-login-google"]')).toBeDisabled();
    });

    test('should handle mobile keyboard interactions', async ({ page }) => {
      await page.goto('/');
      
      // Trigger login modal
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      
      // Switch to email login
      await page.click('[data-testid="email-login-tab"]');
      
      // Focus email input
      await page.click('[data-testid="email-input"]');
      
      // Should adjust layout for keyboard
      await page.waitForTimeout(1000); // Wait for keyboard animation
      
      // Modal should remain accessible
      const modal = page.locator('[data-testid="smart-login-modal"]');
      await expect(modal).toBeVisible();
      
      // Submit button should be visible above keyboard
      await expect(page.locator('[data-testid="email-login-submit"]')).toBeVisible();
    });

    test('should support swipe gestures to close modal', async ({ page }) => {
      await page.goto('/');
      
      // Trigger login modal
      await page.click('[data-testid="save-report-button"]');
      const modal = await authHelpers.waitForLoginModal();
      
      // Simulate swipe down gesture
      await modal.hover();
      await page.mouse.down();
      await page.mouse.move(0, 200); // Swipe down 200px
      await page.mouse.up();
      
      // Modal should close
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('Mobile Safari', () => {
    test.use({ ...test.use(), ...require('@playwright/test').devices['iPhone 12'] });

    test('should handle iOS Safari OAuth peculiarities', async ({ page }) => {
      await page.goto('/');
      
      // Mock iOS Safari OAuth behavior
      await page.route('**/api/auth/signin/github', async route => {
        await route.fulfill({
          status: 302,
          headers: {
            'Location': 'https://github.com/login/oauth/authorize?client_id=test'
          }
        });
      });
      
      // Trigger login
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      await page.click('[data-testid="social-login-github"]');
      
      // Should handle iOS Safari redirect
      await page.waitForURL('**/github.com/login/oauth/authorize**', { timeout: 10000 });
    });

    test('should handle iOS viewport height changes', async ({ page }) => {
      await page.goto('/');
      
      // Trigger login modal
      await page.click('[data-testid="save-report-button"]');
      const modal = await authHelpers.waitForLoginModal();
      
      // Simulate iOS address bar hide/show
      await page.setViewportSize({ width: 390, height: 664 }); // Address bar hidden
      await page.waitForTimeout(500);
      
      // Modal should still be properly positioned
      await expect(modal).toBeVisible();
      
      await page.setViewportSize({ width: 390, height: 844 }); // Address bar shown
      await page.waitForTimeout(500);
      
      // Modal should adjust
      await expect(modal).toBeVisible();
    });

    test('should prevent zoom on input focus', async ({ page }) => {
      await page.goto('/');
      
      // Trigger login modal
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      
      // Switch to email login
      await page.click('[data-testid="email-login-tab"]');
      
      // Check input has proper attributes to prevent zoom
      const emailInput = page.locator('[data-testid="email-input"]');
      await expect(emailInput).toHaveAttribute('autocomplete', 'email');
      
      // Font size should be at least 16px to prevent zoom
      const fontSize = await emailInput.evaluate(el => 
        window.getComputedStyle(el).fontSize
      );
      expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
    });
  });

  test.describe('Tablet Experience', () => {
    test.use({ ...test.use(), ...require('@playwright/test').devices['iPad Pro'] });

    test('should use appropriate modal size for tablets', async ({ page }) => {
      await page.goto('/');
      
      // Trigger login modal
      await page.click('[data-testid="save-report-button"]');
      const modal = await authHelpers.waitForLoginModal();
      
      // Should use centered modal on tablets, not bottom sheet
      await expect(modal).toHaveClass(/tablet-centered/);
      
      // Should be reasonably sized for tablet
      const modalRect = await modal.boundingBox();
      const viewportSize = page.viewportSize();
      
      // Should not be full width on tablet
      expect(modalRect?.width).toBeLessThan((viewportSize?.width || 0) * 0.9);
      
      // Should be centered
      const centerX = (viewportSize?.width || 0) / 2;
      const modalCenterX = (modalRect?.x || 0) + (modalRect?.width || 0) / 2;
      expect(modalCenterX).toBeCloseTo(centerX, 50);
    });

    test('should handle tablet orientation changes', async ({ page }) => {
      await page.goto('/');
      
      // Trigger login modal in portrait
      await page.click('[data-testid="save-report-button"]');
      const modal = await authHelpers.waitForLoginModal();
      
      // Switch to landscape
      await page.setViewportSize({ width: 1366, height: 1024 });
      await page.waitForTimeout(500);
      
      // Modal should remain properly positioned
      await expect(modal).toBeVisible();
      
      // Should maintain appropriate sizing
      const modalRect = await modal.boundingBox();
      expect(modalRect?.width).toBeLessThan(800); // Reasonable max width
    });
  });

  test.describe('Cross-Device Consistency', () => {
    test('should maintain consistent functionality across devices', async ({ page }) => {
      const devices = [
        require('@playwright/test').devices['Pixel 5'],
        require('@playwright/test').devices['iPhone 12'],
        require('@playwright/test').devices['iPad Pro']
      ];

      for (const device of devices) {
        await page.setViewportSize(device.viewport);
        await page.goto('/');
        
        // Trigger login modal
        await page.click('[data-testid="save-report-button"]');
        const modal = await authHelpers.waitForLoginModal();
        
        // Should show same login options
        await expect(page.locator('[data-testid="social-login-github"]')).toBeVisible();
        await expect(page.locator('[data-testid="social-login-google"]')).toBeVisible();
        
        // Should show same content
        await expect(modal).toContainText('登录');
        
        // Close modal for next iteration
        await page.click('[data-testid="modal-close"]');
        await page.waitForTimeout(500);
      }
    });

    test('should handle device-specific error scenarios', async ({ page }) => {
      // Test network error on mobile
      await page.setViewportSize(require('@playwright/test').devices['Pixel 5'].viewport);
      await page.goto('/');
      
      // Mock network failure
      await page.route('**/api/auth/signin/github', route => route.abort('failed'));
      
      // Trigger login
      await page.click('[data-testid="save-report-button"]');
      await authHelpers.waitForLoginModal();
      await page.click('[data-testid="social-login-github"]');
      
      // Should show mobile-appropriate error message
      await expect(page.locator('[data-testid="mobile-network-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-login-button"]')).toBeVisible();
    });
  });
});