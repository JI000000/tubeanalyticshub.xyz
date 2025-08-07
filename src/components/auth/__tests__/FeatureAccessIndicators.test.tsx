/**
 * 功能访问权限视觉指示器组件测试
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LockIcon, LoginRequiredBadge } from '../FeatureAccessIndicators';

// Mock the hooks and utilities
jest.mock('@/hooks/useSmartAuth', () => ({
  useSmartAuth: () => ({
    checkFeatureAccess: jest.fn(() => ({ allowed: false, message: 'Login required' })),
    requireAuth: jest.fn()
  })
}));

jest.mock('@/lib/feature-access-control', () => ({
  getFeatureConfig: jest.fn(() => ({
    accessLevel: 'authenticated',
    description: 'Test feature',
    loginMessage: 'Login required for this feature'
  }))
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

describe('FeatureAccessIndicators', () => {
  describe('LockIcon', () => {
    it('should render lock icon for restricted feature', () => {
      render(<LockIcon featureId="test_feature" showTooltip={false} />);
      
      // The component should render some content for restricted features
      // Since we're mocking the access check to return false, it should show the icon
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('should not render for allowed features', () => {
      // Mock allowed access
      const useSmartAuthModule = require('@/hooks/useSmartAuth');
      useSmartAuthModule.useSmartAuth.mockReturnValue({
        checkFeatureAccess: () => ({ allowed: true, message: '' }),
        requireAuth: jest.fn()
      });

      const { container } = render(<LockIcon featureId="test_feature" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('LoginRequiredBadge', () => {
    it('should render badge for restricted feature', () => {
      render(<LoginRequiredBadge featureId="test_feature" />);
      
      // Should render a badge with appropriate text
      expect(screen.getByText('需要登录')).toBeInTheDocument();
    });

    it('should not render for allowed features', () => {
      // Mock allowed access
      const useSmartAuthModule = require('@/hooks/useSmartAuth');
      useSmartAuthModule.useSmartAuth.mockReturnValue({
        checkFeatureAccess: () => ({ allowed: true, message: '' }),
        requireAuth: jest.fn()
      });

      const { container } = render(<LoginRequiredBadge featureId="test_feature" />);
      expect(container.firstChild).toBeNull();
    });
  });
});