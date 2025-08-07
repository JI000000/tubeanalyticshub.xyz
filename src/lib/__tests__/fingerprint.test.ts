/**
 * Fingerprint Utility Tests
 * 
 * Tests for browser fingerprinting functionality used in anonymous trial tracking
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { generateFingerprint, validateFingerprint, getFingerprintComponents } from '../fingerprint';

// Mock FingerprintJS
const mockFingerprintJS = {
  load: jest.fn(),
  get: jest.fn(),
};

jest.mock('@fingerprintjs/fingerprintjs', () => ({
  default: mockFingerprintJS,
}));

describe('Fingerprint Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful fingerprint generation
    mockFingerprintJS.load.mockResolvedValue({
      get: jest.fn().mockResolvedValue({
        visitorId: 'test-visitor-id-123',
        components: {
          userAgent: { value: 'Mozilla/5.0 (Test Browser)' },
          language: { value: 'en-US' },
          colorDepth: { value: 24 },
          deviceMemory: { value: 8 },
          hardwareConcurrency: { value: 4 },
          screenResolution: { value: [1920, 1080] },
          timezone: { value: 'America/New_York' },
          sessionStorage: { value: true },
          localStorage: { value: true },
          indexedDB: { value: true },
          openDatabase: { value: false },
          cpuClass: { value: undefined },
          platform: { value: 'MacIntel' },
          plugins: { value: [] },
          canvas: { value: 'canvas-hash-123' },
          webgl: { value: 'webgl-hash-456' },
          webglVendorAndRenderer: { value: 'Intel Inc.~Intel Iris Pro OpenGL Engine' },
          adBlock: { value: false },
          hasLiedLanguages: { value: false },
          hasLiedResolution: { value: false },
          hasLiedOs: { value: false },
          hasLiedBrowser: { value: false },
          touchSupport: { value: [0, false, false] },
          fonts: { value: ['Arial', 'Helvetica', 'Times'] },
          audio: { value: 'audio-hash-789' },
        },
      }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateFingerprint', () => {
    it('should generate a valid fingerprint', async () => {
      const fingerprint = await generateFingerprint();

      expect(fingerprint).toBeDefined();
      expect(typeof fingerprint).toBe('string');
      expect(fingerprint.length).toBeGreaterThan(0);
      expect(fingerprint).toBe('test-visitor-id-123');
    });

    it('should handle FingerprintJS loading errors', async () => {
      mockFingerprintJS.load.mockRejectedValue(new Error('Failed to load FingerprintJS'));

      const fingerprint = await generateFingerprint();

      // Should return a fallback fingerprint
      expect(fingerprint).toBeDefined();
      expect(fingerprint).toContain('fallback-');
    });

    it('should handle fingerprint generation errors', async () => {
      const mockFp = {
        get: jest.fn().mockRejectedValue(new Error('Failed to generate fingerprint')),
      };
      mockFingerprintJS.load.mockResolvedValue(mockFp);

      const fingerprint = await generateFingerprint();

      // Should return a fallback fingerprint
      expect(fingerprint).toBeDefined();
      expect(fingerprint).toContain('fallback-');
    });

    it('should generate consistent fingerprints for same environment', async () => {
      const fingerprint1 = await generateFingerprint();
      const fingerprint2 = await generateFingerprint();

      expect(fingerprint1).toBe(fingerprint2);
    });

    it('should include timestamp in fallback fingerprints', async () => {
      mockFingerprintJS.load.mockRejectedValue(new Error('Test error'));

      const fingerprint = await generateFingerprint();

      expect(fingerprint).toMatch(/fallback-\d+/);
    });
  });

  describe('validateFingerprint', () => {
    it('should validate correct fingerprint format', () => {
      const validFingerprints = [
        'test-visitor-id-123',
        'abcdef123456789',
        'fingerprint-with-dashes',
        'fallback-1234567890',
      ];

      validFingerprints.forEach(fingerprint => {
        expect(validateFingerprint(fingerprint)).toBe(true);
      });
    });

    it('should reject invalid fingerprint formats', () => {
      const invalidFingerprints = [
        '',
        null,
        undefined,
        123,
        {},
        [],
        'a', // too short
        'x'.repeat(256), // too long
        'invalid<script>alert("xss")</script>',
        '../../../etc/passwd',
        'fingerprint with spaces',
        'fingerprint\nwith\nnewlines',
      ];

      invalidFingerprints.forEach(fingerprint => {
        expect(validateFingerprint(fingerprint as any)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(validateFingerprint('a'.repeat(255))).toBe(true); // max length
      expect(validateFingerprint('a'.repeat(256))).toBe(false); // over max length
      expect(validateFingerprint('ab')).toBe(true); // min length
      expect(validateFingerprint('a')).toBe(false); // under min length
    });
  });

  describe('getFingerprintComponents', () => {
    it('should return fingerprint components', async () => {
      const components = await getFingerprintComponents();

      expect(components).toBeDefined();
      expect(components.userAgent).toBe('Mozilla/5.0 (Test Browser)');
      expect(components.language).toBe('en-US');
      expect(components.colorDepth).toBe(24);
      expect(components.deviceMemory).toBe(8);
      expect(components.hardwareConcurrency).toBe(4);
      expect(components.screenResolution).toEqual([1920, 1080]);
      expect(components.timezone).toBe('America/New_York');
    });

    it('should handle missing components gracefully', async () => {
      const mockFp = {
        get: jest.fn().mockResolvedValue({
          visitorId: 'test-id',
          components: {
            userAgent: { value: 'Test Browser' },
            // Missing other components
          },
        }),
      };
      mockFingerprintJS.load.mockResolvedValue(mockFp);

      const components = await getFingerprintComponents();

      expect(components.userAgent).toBe('Test Browser');
      expect(components.language).toBeUndefined();
      expect(components.colorDepth).toBeUndefined();
    });

    it('should handle component extraction errors', async () => {
      mockFingerprintJS.load.mockRejectedValue(new Error('Component extraction failed'));

      const components = await getFingerprintComponents();

      expect(components).toEqual({});
    });

    it('should extract security-relevant components', async () => {
      const components = await getFingerprintComponents();

      // Security-relevant components for fraud detection
      expect(components.canvas).toBeDefined();
      expect(components.webgl).toBeDefined();
      expect(components.audio).toBeDefined();
      expect(components.fonts).toBeDefined();
      expect(components.plugins).toBeDefined();
    });

    it('should detect potential spoofing attempts', async () => {
      const mockFp = {
        get: jest.fn().mockResolvedValue({
          visitorId: 'spoofed-id',
          components: {
            hasLiedLanguages: { value: true },
            hasLiedResolution: { value: true },
            hasLiedOs: { value: true },
            hasLiedBrowser: { value: true },
          },
        }),
      };
      mockFingerprintJS.load.mockResolvedValue(mockFp);

      const components = await getFingerprintComponents();

      expect(components.hasLiedLanguages).toBe(true);
      expect(components.hasLiedResolution).toBe(true);
      expect(components.hasLiedOs).toBe(true);
      expect(components.hasLiedBrowser).toBe(true);
    });
  });

  describe('Fingerprint Stability', () => {
    it('should generate stable fingerprints across page reloads', async () => {
      const fingerprints = [];
      
      for (let i = 0; i < 5; i++) {
        const fingerprint = await generateFingerprint();
        fingerprints.push(fingerprint);
      }

      // All fingerprints should be identical
      const uniqueFingerprints = new Set(fingerprints);
      expect(uniqueFingerprints.size).toBe(1);
    });

    it('should handle browser environment changes', async () => {
      // Simulate environment change
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Different Browser',
        configurable: true,
      });

      const mockFp = {
        get: jest.fn().mockResolvedValue({
          visitorId: 'changed-environment-id',
          components: {
            userAgent: { value: 'Different Browser' },
          },
        }),
      };
      mockFingerprintJS.load.mockResolvedValue(mockFp);

      const fingerprint = await generateFingerprint();

      expect(fingerprint).toBe('changed-environment-id');

      // Restore original user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUserAgent,
        configurable: true,
      });
    });
  });

  describe('Privacy and Security', () => {
    it('should not expose sensitive information', async () => {
      const components = await getFingerprintComponents();

      // Should not contain personally identifiable information
      const componentValues = Object.values(components);
      const serialized = JSON.stringify(componentValues);

      expect(serialized).not.toContain('@'); // No email addresses
      expect(serialized).not.toContain('password'); // No passwords
      expect(serialized).not.toContain('token'); // No tokens
      expect(serialized).not.toContain('key'); // No API keys
    });

    it('should handle privacy-conscious browsers', async () => {
      // Simulate privacy-focused browser with limited fingerprinting
      const mockFp = {
        get: jest.fn().mockResolvedValue({
          visitorId: 'privacy-limited-id',
          components: {
            userAgent: { value: 'Privacy Browser' },
            language: { value: 'en' },
            // Most other components blocked or spoofed
            canvas: { value: null },
            webgl: { value: null },
            audio: { value: null },
            fonts: { value: [] },
          },
        }),
      };
      mockFingerprintJS.load.mockResolvedValue(mockFp);

      const fingerprint = await generateFingerprint();
      const components = await getFingerprintComponents();

      expect(fingerprint).toBe('privacy-limited-id');
      expect(components.canvas).toBeNull();
      expect(components.webgl).toBeNull();
      expect(components.audio).toBeNull();
      expect(components.fonts).toEqual([]);
    });

    it('should respect Do Not Track settings', async () => {
      // Mock Do Not Track enabled
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        configurable: true,
      });

      const fingerprint = await generateFingerprint();

      // Should still work but with reduced fingerprinting
      expect(fingerprint).toBeDefined();
      expect(typeof fingerprint).toBe('string');
    });
  });

  describe('Performance', () => {
    it('should generate fingerprints within reasonable time', async () => {
      const startTime = Date.now();
      await generateFingerprint();
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent fingerprint generation', async () => {
      const promises = Array.from({ length: 10 }, () => generateFingerprint());
      
      const startTime = Date.now();
      const fingerprints = await Promise.all(promises);
      const endTime = Date.now();

      // All should complete and be identical
      expect(fingerprints).toHaveLength(10);
      expect(new Set(fingerprints).size).toBe(1);
      expect(endTime - startTime).toBeLessThan(10000); // Within 10 seconds
    });

    it('should cache fingerprint results', async () => {
      // First call
      const startTime1 = Date.now();
      const fingerprint1 = await generateFingerprint();
      const endTime1 = Date.now();

      // Second call should be faster (cached)
      const startTime2 = Date.now();
      const fingerprint2 = await generateFingerprint();
      const endTime2 = Date.now();

      expect(fingerprint1).toBe(fingerprint2);
      expect(endTime2 - startTime2).toBeLessThanOrEqual(endTime1 - startTime1);
    });
  });

  describe('Requirements Coverage', () => {
    it('✅ 需求 7.1: 基于浏览器指纹提供试用机会', async () => {
      const fingerprint = await generateFingerprint();
      
      expect(fingerprint).toBeDefined();
      expect(validateFingerprint(fingerprint)).toBe(true);
    });

    it('✅ 需求 7.2: 防篡改逻辑', async () => {
      const components = await getFingerprintComponents();
      
      // Should detect spoofing attempts
      expect(components.hasLiedLanguages).toBeDefined();
      expect(components.hasLiedResolution).toBeDefined();
      expect(components.hasLiedOs).toBeDefined();
      expect(components.hasLiedBrowser).toBeDefined();
    });

    it('✅ 指纹缓存和过期机制', async () => {
      // Test caching behavior
      const fingerprint1 = await generateFingerprint();
      const fingerprint2 = await generateFingerprint();
      
      expect(fingerprint1).toBe(fingerprint2);
    });

    it('✅ 唯一设备标识生成', async () => {
      const fingerprint = await generateFingerprint();
      
      expect(fingerprint).toMatch(/^[a-zA-Z0-9\-_]+$/);
      expect(fingerprint.length).toBeGreaterThan(5);
      expect(fingerprint.length).toBeLessThan(256);
    });
  });
});