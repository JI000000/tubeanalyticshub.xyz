import { test as base, expect } from '@playwright/test';

// Test data and utilities for authentication tests
export const testUsers = {
  newUser: {
    email: 'test-new-user@example.com',
    password: 'TestPassword123!',
    displayName: 'Test New User'
  },
  existingUser: {
    email: 'test-existing@example.com', 
    password: 'ExistingPassword123!',
    displayName: 'Existing Test User'
  }
};

export const testUrls = {
  home: '/',
  dashboard: '/en/dashboard',
  videos: '/en/videos',
  reports: '/en/reports',
  settings: '/en/settings',
  export: '/en/export',
  insights: '/en/insights',
  teams: '/en/teams'
};

// Custom fixtures for authentication testing
type AuthFixtures = {
  anonymousUser: any;
  authenticatedUser: any;
  trialUser: any;
};

export const test = base.extend<AuthFixtures>({
  // Anonymous user fixture - clears all storage
  anonymousUser: async ({ page }: { page: any }, use: any) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await use(page);
  },

  // Authenticated user fixture - simulates logged in user
  authenticatedUser: async ({ page }: { page: any }, use: any) => {
    // Mock authentication state
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-state', JSON.stringify({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          displayName: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
          plan: 'free'
        },
        isAuthenticated: true
      }));
    });
    await use(page);
  },

  // Trial user fixture - simulates user with limited trials
  trialUser: async ({ page }: { page: any }, use: any) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('trial_status', JSON.stringify({
        remaining: 2,
        total: 5,
        fingerprint: 'test-fingerprint',
        lastUsed: new Date().toISOString(),
        actions: []
      }));
    });
    await use(page);
  }
});

export { expect } from '@playwright/test';

// Helper functions for common authentication actions
export class AuthHelpers {
  constructor(private page: any) {}

  async waitForLoginModal() {
    return await this.page.waitForSelector('[data-testid="smart-login-modal"]', { timeout: 5000 });
  }

  async clickSocialLogin(provider: 'github' | 'google') {
    await this.page.click(`[data-testid="social-login-${provider}"]`);
  }

  async fillEmailLogin(email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="email-login-submit"]');
  }

  async expectTrialStatus(remaining: number) {
    const trialIndicator = this.page.locator('[data-testid="trial-status-indicator"]');
    await expect(trialIndicator).toContainText(`${remaining}`);
  }

  async expectAuthenticatedState() {
    const userProfile = this.page.locator('[data-testid="user-profile"]');
    await expect(userProfile).toBeVisible();
  }

  async expectAnonymousState() {
    const loginButton = this.page.locator('[data-testid="login-button"]');
    await expect(loginButton).toBeVisible();
  }

  async triggerFeatureRequiringAuth(feature: string) {
    await this.page.click(`[data-testid="feature-${feature}"]`);
  }

  async consumeTrial() {
    await this.page.click('[data-testid="consume-trial-button"]');
  }

  async expectLoginPrompt(scenario: string) {
    const modal = await this.waitForLoginModal();
    await expect(modal).toContainText(scenario);
  }
}