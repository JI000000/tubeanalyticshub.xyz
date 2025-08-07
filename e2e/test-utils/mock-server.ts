import { Page } from '@playwright/test';

export class MockAuthServer {
  constructor(private page: Page) {}

  async mockSuccessfulGitHubAuth() {
    await this.page.route('**/api/auth/signin/github', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': 'https://github.com/login/oauth/authorize?client_id=test&redirect_uri=http://localhost:3000/api/auth/callback/github&state=test'
        }
      });
    });

    await this.page.route('**/api/auth/callback/github**', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/?login=success'
        }
      });
    });

    await this.page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'github-user-123',
            email: 'test@github.com',
            name: 'GitHub Test User',
            image: 'https://avatars.githubusercontent.com/u/123'
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });
  }

  async mockSuccessfulGoogleAuth() {
    await this.page.route('**/api/auth/signin/google', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': 'https://accounts.google.com/oauth/authorize?client_id=test&redirect_uri=http://localhost:3000/api/auth/callback/google'
        }
      });
    });

    await this.page.route('**/api/auth/callback/google**', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/?login=success'
        }
      });
    });

    await this.page.route('**/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'google-user-123',
            email: 'test@gmail.com',
            name: 'Google Test User',
            image: 'https://lh3.googleusercontent.com/a/test'
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      });
    });
  }

  async mockTrialAPI() {
    await this.page.route('**/api/trial/consume', async route => {
      const request = route.request();
      const body = JSON.parse(request.postData() || '{}');
      
      // Simulate trial consumption
      const currentTrials = await this.page.evaluate(() => {
        const trialData = localStorage.getItem('trial_status');
        return trialData ? JSON.parse(trialData) : { remaining: 5 };
      });

      const newRemaining = Math.max(0, currentTrials.remaining - 1);
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          remaining: newRemaining,
          blocked: newRemaining === 0,
          message: newRemaining === 0 ? '试用次数已用完' : `还剩 ${newRemaining} 次试用`
        })
      });
    });
  }

  async mockAnalyticsAPI() {
    await this.page.route('**/api/auth/analytics/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            event: 'login_prompt_shown',
            timestamp: Date.now(),
            context: route.request().url()
          }
        })
      });
    });
  }

  async mockUserSyncAPI() {
    await this.page.route('**/api/user/sync', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'synced-user-123',
            preferences: {
              language: 'zh-CN',
              theme: 'light'
            },
            trialData: {
              migrated: true,
              previousTrials: 3
            }
          }
        })
      });
    });
  }

  async mockErrorScenarios() {
    // Network errors
    await this.page.route('**/api/auth/signin/github', route => {
      if (Math.random() < 0.3) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // Server errors
    await this.page.route('**/api/auth/session', route => {
      if (Math.random() < 0.1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      } else {
        route.continue();
      }
    });

    // Rate limiting
    await this.page.route('**/api/trial/consume', route => {
      if (Math.random() < 0.05) {
        route.fulfill({
          status: 429,
          headers: { 'Retry-After': '60' },
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Rate limit exceeded' })
        });
      } else {
        route.continue();
      }
    });
  }

  async setupAnalyticsTracking() {
    await this.page.addInitScript(() => {
      (window as any).analyticsEvents = [];
      (window as any).trackEvent = (event: string, data: any) => {
        (window as any).analyticsEvents.push({
          event,
          data,
          timestamp: Date.now(),
          url: window.location.href
        });
      };
    });
  }

  async getAnalyticsEvents() {
    return await this.page.evaluate(() => (window as any).analyticsEvents || []);
  }

  async clearAnalyticsEvents() {
    await this.page.evaluate(() => {
      (window as any).analyticsEvents = [];
    });
  }
}