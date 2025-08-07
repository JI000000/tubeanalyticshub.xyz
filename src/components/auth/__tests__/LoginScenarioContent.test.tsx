import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoginScenarioContent } from '../LoginScenarioContent';
import type { LoginTrigger, LoginContext } from '../SmartLoginModal';

describe('LoginScenarioContent', () => {
  const mockContext: LoginContext = {
    previousAction: 'test_action',
    returnUrl: '/test',
    metadata: {}
  };

  describe('Trial Exhausted Scenario', () => {
    const trigger: LoginTrigger = {
      type: 'trial_exhausted',
      message: 'Trial exhausted message',
      urgency: 'high',
      allowSkip: false
    };

    it('renders trial exhausted content with correct title and benefits', () => {
      render(<LoginScenarioContent trigger={trigger} context={mockContext} />);
      
      expect(screen.getByText('免费试用已用完')).toBeInTheDocument();
      expect(screen.getByText('您已经使用完所有免费分析次数，登录后即可获得更多权益')).toBeInTheDocument();
      expect(screen.getByText('登录后立即获得')).toBeInTheDocument();
      expect(screen.getByText(/无限制分析/)).toBeInTheDocument();
      expect(screen.getByText(/保存报告/)).toBeInTheDocument();
      expect(screen.getByText(/高级功能/)).toBeInTheDocument();
      expect(screen.getByText(/数据导出/)).toBeInTheDocument();
    });

    it('shows urgency indicator for trial exhausted', () => {
      render(<LoginScenarioContent trigger={trigger} context={mockContext} />);
      
      expect(screen.getByText('现在登录，立即恢复分析功能')).toBeInTheDocument();
    });
  });

  describe('Save Action Scenario', () => {
    const trigger: LoginTrigger = {
      type: 'save_action',
      message: 'Save action message',
      urgency: 'medium',
      allowSkip: true
    };

    const contextWithActionName: LoginContext = {
      ...mockContext,
      metadata: { actionName: '视频分析报告' }
    };

    it('renders save action content with custom action name', () => {
      render(<LoginScenarioContent trigger={trigger} context={contextWithActionName} />);
      
      expect(screen.getByText('保存您的工作成果')).toBeInTheDocument();
      expect(screen.getByText('登录后即可保存「视频分析报告」，避免数据丢失')).toBeInTheDocument();
      expect(screen.getByText('为什么需要登录保存？')).toBeInTheDocument();
      expect(screen.getByText(/数据安全/)).toBeInTheDocument();
      expect(screen.getByText(/随时访问/)).toBeInTheDocument();
      expect(screen.getByText(/历史记录/)).toBeInTheDocument();
      expect(screen.getByText(/团队协作/)).toBeInTheDocument();
    });

    it('uses default action name when not provided', () => {
      render(<LoginScenarioContent trigger={trigger} context={mockContext} />);
      
      expect(screen.getByText('登录后即可保存「保存分析报告」，避免数据丢失')).toBeInTheDocument();
    });
  });

  describe('Premium Feature Scenario', () => {
    const trigger: LoginTrigger = {
      type: 'premium_feature',
      message: 'Premium feature message',
      urgency: 'medium',
      allowSkip: true
    };

    const contextWithFeatureName: LoginContext = {
      ...mockContext,
      metadata: { featureName: '竞品分析' }
    };

    it('renders premium feature content with custom feature name', () => {
      render(<LoginScenarioContent trigger={trigger} context={contextWithFeatureName} />);
      
      expect(screen.getByText('解锁高级功能')).toBeInTheDocument();
      expect(screen.getByText('「竞品分析」是专为注册用户提供的高级功能')).toBeInTheDocument();
      expect(screen.getByText('高级功能包含')).toBeInTheDocument();
      
      // Check that key features are mentioned
      expect(screen.getByText(/深度对比同类视频的表现数据/)).toBeInTheDocument();
      expect(screen.getByText(/AI驱动的视频表现趋势预测/)).toBeInTheDocument();
      expect(screen.getByText(/一次性分析多个视频或频道/)).toBeInTheDocument();
      expect(screen.getByText(/通过API集成到您的工作流程/)).toBeInTheDocument();
      expect(screen.getByText(/邀请团队成员共同分析和讨论/)).toBeInTheDocument();
    });

    it('shows professional value proposition', () => {
      render(<LoginScenarioContent trigger={trigger} context={contextWithFeatureName} />);
      
      expect(screen.getByText(/加入 10,000\+ 专业创作者/)).toBeInTheDocument();
    });
  });

  describe('Data Export Scenario', () => {
    const trigger: LoginTrigger = {
      type: 'data_export',
      message: 'Data export message',
      urgency: 'low',
      allowSkip: false
    };

    const contextWithFormat: LoginContext = {
      ...mockContext,
      metadata: { format: 'PDF' }
    };

    it('renders data export content with custom format', () => {
      render(<LoginScenarioContent trigger={trigger} context={contextWithFormat} />);
      
      expect(screen.getByText('安全导出数据')).toBeInTheDocument();
      expect(screen.getByText('为保护数据安全，导出PDF格式需要登录验证')).toBeInTheDocument();
      expect(screen.getByText('为什么需要登录导出？')).toBeInTheDocument();
      
      // Check that key security features are mentioned
      expect(screen.getByText(/确保只有授权用户才能导出敏感数据/)).toBeInTheDocument();
      expect(screen.getByText(/记录导出历史，便于数据管理和审计/)).toBeInTheDocument();
      expect(screen.getByText(/为注册用户提供更多导出格式选择/)).toBeInTheDocument();
      expect(screen.getByText(/导出文件自动保存到您的账户中/)).toBeInTheDocument();
    });

    it('shows supported export formats', () => {
      render(<LoginScenarioContent trigger={trigger} context={contextWithFormat} />);
      
      expect(screen.getByText('支持的导出格式')).toBeInTheDocument();
      expect(screen.getByText('Excel (.xlsx)')).toBeInTheDocument();
      expect(screen.getByText('PDF 报告')).toBeInTheDocument();
      expect(screen.getByText('CSV 数据')).toBeInTheDocument();
      expect(screen.getByText('JSON 格式')).toBeInTheDocument();
    });

    it('uses default format when not provided', () => {
      render(<LoginScenarioContent trigger={trigger} context={mockContext} />);
      
      expect(screen.getByText('为保护数据安全，导出Excel格式需要登录验证')).toBeInTheDocument();
    });
  });

  describe('Feature Required Scenario', () => {
    const trigger: LoginTrigger = {
      type: 'feature_required',
      message: 'Feature required message',
      urgency: 'low',
      allowSkip: true
    };

    const contextWithFeatureName: LoginContext = {
      ...mockContext,
      metadata: { featureName: '历史记录' }
    };

    it('renders feature required content with custom feature name', () => {
      render(<LoginScenarioContent trigger={trigger} context={contextWithFeatureName} />);
      
      expect(screen.getByText('登录后使用')).toBeInTheDocument();
      expect(screen.getByText('历史记录需要登录后才能使用')).toBeInTheDocument();
      expect(screen.getByText('登录后即可使用')).toBeInTheDocument();
      expect(screen.getByText('完整的功能访问权限')).toBeInTheDocument();
      expect(screen.getByText('个人数据和设置同步')).toBeInTheDocument();
      expect(screen.getByText('使用历史和偏好记录')).toBeInTheDocument();
    });

    it('uses default feature name when not provided', () => {
      render(<LoginScenarioContent trigger={trigger} context={mockContext} />);
      
      expect(screen.getByText('此功能需要登录后才能使用')).toBeInTheDocument();
    });
  });

  describe('Mobile Layout', () => {
    const trigger: LoginTrigger = {
      type: 'trial_exhausted',
      message: 'Test message',
      urgency: 'high',
      allowSkip: false
    };

    it('applies mobile-specific styling when isMobile is true', () => {
      const { container } = render(
        <LoginScenarioContent trigger={trigger} context={mockContext} isMobile={true} />
      );
      
      // Check if mobile-specific padding is applied
      const contentDiv = container.querySelector('.space-y-4');
      expect(contentDiv).toHaveClass('px-2');
    });

    it('does not apply mobile styling when isMobile is false', () => {
      const { container } = render(
        <LoginScenarioContent trigger={trigger} context={mockContext} isMobile={false} />
      );
      
      const contentDiv = container.querySelector('.space-y-4');
      expect(contentDiv).not.toHaveClass('px-2');
    });
  });

  describe('Visual Elements', () => {
    it('renders appropriate icons for each scenario', () => {
      const scenarios = [
        { type: 'trial_exhausted' as const, expectedIcon: 'AlertTriangle' },
        { type: 'save_action' as const, expectedIcon: 'Save' },
        { type: 'premium_feature' as const, expectedIcon: 'Crown' },
        { type: 'data_export' as const, expectedIcon: 'Download' },
        { type: 'feature_required' as const, expectedIcon: 'Lock' }
      ];

      scenarios.forEach(({ type }) => {
        const trigger: LoginTrigger = {
          type,
          message: 'Test message',
          urgency: 'low',
          allowSkip: true
        };

        const { container } = render(
          <LoginScenarioContent trigger={trigger} context={mockContext} />
        );

        // Check that an icon container exists
        const iconContainer = container.querySelector('.w-16.h-16');
        expect(iconContainer).toBeInTheDocument();
      });
    });

    it('uses appropriate color schemes for different scenarios', () => {
      const scenarios = [
        { type: 'trial_exhausted' as const, colorClass: 'bg-orange-100' },
        { type: 'save_action' as const, colorClass: 'bg-green-100' },
        { type: 'premium_feature' as const, colorClass: 'bg-purple-100' },
        { type: 'data_export' as const, colorClass: 'bg-blue-100' },
        { type: 'feature_required' as const, colorClass: 'bg-gray-100' }
      ];

      scenarios.forEach(({ type, colorClass }) => {
        const trigger: LoginTrigger = {
          type,
          message: 'Test message',
          urgency: 'low',
          allowSkip: true
        };

        const { container } = render(
          <LoginScenarioContent trigger={trigger} context={mockContext} />
        );

        const iconContainer = container.querySelector('.w-16.h-16');
        expect(iconContainer).toHaveClass(colorClass);
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      const trigger: LoginTrigger = {
        type: 'trial_exhausted',
        message: 'Test message',
        urgency: 'high',
        allowSkip: false
      };

      render(<LoginScenarioContent trigger={trigger} context={mockContext} />);
      
      // Check for proper heading hierarchy
      expect(screen.getByRole('heading', { level: 3, name: '免费试用已用完' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: '登录后立即获得' })).toBeInTheDocument();
    });

    it('provides meaningful text content for screen readers', () => {
      const trigger: LoginTrigger = {
        type: 'save_action',
        message: 'Test message',
        urgency: 'medium',
        allowSkip: true
      };

      render(<LoginScenarioContent trigger={trigger} context={mockContext} />);
      
      // Check that important information is available as text
      expect(screen.getByText(/确保您的分析结果安全存储，不会丢失/)).toBeInTheDocument();
      expect(screen.getByText(/在任何设备上都能查看您保存的报告/)).toBeInTheDocument();
    });
  });
});