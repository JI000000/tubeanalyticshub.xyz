# 功能访问权限视觉指示器

本文档描述了功能访问权限视觉指示器系统的实现和使用方法。

## 概述

功能访问权限视觉指示器系统为用户提供清晰的视觉反馈，帮助他们了解哪些功能需要登录、哪些功能可以试用、以及如何获得访问权限。

## 核心组件

### 1. FeatureAccessIndicators.tsx

主要的视觉指示器组件集合：

#### LockIcon
- **用途**: 在需要登录的功能按钮上添加锁定图标
- **支持的访问级别**: trial (⚡), authenticated (🔒), premium (👑)
- **尺寸**: sm, default, lg
- **工具提示**: 可选的悬停提示

```tsx
<LockIcon featureId="save_report" size="default" showTooltip={true} />
```

#### LoginRequiredBadge
- **用途**: 创建"登录后可用"的标签组件
- **变体**: default, outline, secondary
- **交互**: 点击触发登录流程

```tsx
<LoginRequiredBadge featureId="export_data" variant="outline" />
```

#### FeaturePermissionTooltip
- **用途**: 添加hover提示显示登录要求的原因
- **功能**: 显示功能描述、登录消息和权益列表
- **位置**: 支持四个方向的定位

```tsx
<FeaturePermissionTooltip featureId="advanced_analytics">
  <Button>高级分析</Button>
</FeaturePermissionTooltip>
```

#### DisabledFeatureOverlay
- **用途**: 实现功能禁用状态的视觉样式
- **覆盖类型**: blur (模糊), dim (变暗), replace (替换)
- **登录按钮**: 可选的快速登录按钮

```tsx
<DisabledFeatureOverlay featureId="team_collaboration" overlayType="blur">
  <FeatureCard />
</DisabledFeatureOverlay>
```

#### FeatureAccessIndicator
- **用途**: 统一的功能访问状态指示器
- **类型**: icon, badge, tooltip, overlay
- **配置**: 支持多种显示选项

```tsx
<FeatureAccessIndicator 
  featureId="api_access" 
  type="overlay"
  showBenefits={true}
>
  <Button>API访问</Button>
</FeatureAccessIndicator>
```

### 2. FeatureButton.tsx

集成了权限检查和视觉指示器的按钮组件：

#### FeatureButton
- **功能**: 自动检查权限并显示相应的视觉指示器
- **锁定图标**: 可配置位置和显示
- **工具提示**: 自动显示权限信息
- **点击处理**: 有权限时执行回调，无权限时触发登录

```tsx
<FeatureButton
  featureId="save_report"
  onClick={() => saveReport()}
  showLockIcon={true}
  lockIconPosition="left"
>
  保存报告
</FeatureButton>
```

#### 预设按钮组件
提供常用功能的预设按钮：

- `SaveReportButton` - 保存报告
- `ExportDataButton` - 导出数据
- `AdvancedAnalyticsButton` - 高级分析
- `TeamCollaborationButton` - 团队协作
- `VideoAnalysisButton` - 视频分析
- `CompetitorAnalysisButton` - 竞争对手分析
- `ApiAccessButton` - API访问
- `AdminPanelButton` - 管理面板

### 3. FeatureAccessStatus.tsx

功能访问状态显示组件：

#### FeatureAccessOverview
- **功能**: 显示用户当前的功能访问状态概览
- **统计**: 各访问级别的功能数量和可用数量
- **进度条**: 总体访问率可视化

#### TrialFeaturesStatus
- **功能**: 显示试用功能的使用情况
- **进度**: 每个试用功能的使用次数和限制
- **提示**: 试用用完后的登录提示

#### FeatureList
- **功能**: 显示功能列表和访问状态
- **筛选**: 可按访问级别或受限状态筛选
- **操作**: 提供解锁功能的快捷操作

## 访问级别配置

系统支持四种访问级别：

### public (公开)
- **图标**: ✅ Check
- **颜色**: 绿色
- **描述**: 所有用户都可以访问

### trial (试用)
- **图标**: ⚡ Zap
- **颜色**: 黄色
- **描述**: 匿名用户可以试用，有次数限制

### authenticated (登录)
- **图标**: 🔒 Lock
- **颜色**: 蓝色
- **描述**: 需要用户登录才能访问

### premium (高级)
- **图标**: 👑 Crown
- **颜色**: 紫色
- **描述**: 需要付费订阅才能访问

## 样式系统

### CSS 类名约定

- `.feature-lock-icon` - 锁定图标样式
- `.feature-disabled` - 禁用功能样式
- `.login-required-badge` - 登录要求标签样式
- `.feature-button` - 功能按钮样式
- `.feature-card-disabled` - 禁用卡片样式

### 主题支持

- **浅色模式**: 默认配色方案
- **深色模式**: 自动适配深色主题
- **高对比度**: 支持高对比度模式
- **响应式**: 移动端优化

### 动画效果

- **悬停动画**: 图标和按钮的悬停效果
- **脉冲动画**: 登录要求标签的脉冲提示
- **过渡动画**: 状态切换的平滑过渡
- **减少动画**: 支持用户的动画偏好设置

## 使用示例

### 基础用法

```tsx
import { FeatureButton, LockIcon } from '@/components/auth/FeatureAccessIndicators';

// 带锁定图标的按钮
<FeatureButton featureId="save_report">
  保存报告
</FeatureButton>

// 功能标题旁的图标
<h3>
  高级分析 <LockIcon featureId="advanced_analytics" size="sm" />
</h3>
```

### 复杂场景

```tsx
import { 
  FeatureAccessIndicator, 
  FeaturePermissionTooltip 
} from '@/components/auth/FeatureAccessIndicators';

// 带工具提示的功能卡片
<FeaturePermissionTooltip featureId="team_collaboration">
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        团队协作
        <FeatureAccessIndicator featureId="team_collaboration" type="badge" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <FeatureAccessIndicator featureId="team_collaboration" type="overlay">
        <Button>开始协作</Button>
      </FeatureAccessIndicator>
    </CardContent>
  </Card>
</FeaturePermissionTooltip>
```

### 状态显示

```tsx
import { 
  FeatureAccessOverview, 
  TrialFeaturesStatus, 
  FeatureList 
} from '@/components/auth/FeatureAccessStatus';

// 功能访问状态面板
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <FeatureAccessOverview />
  <TrialFeaturesStatus />
</div>

// 受限功能列表
<FeatureList showOnlyRestricted={true} />
```

## 最佳实践

### 1. 一致性
- 在整个应用中使用统一的视觉指示器
- 保持图标、颜色和文案的一致性
- 遵循既定的访问级别配色方案

### 2. 可发现性
- 在关键功能入口显示访问状态
- 使用工具提示提供详细信息
- 提供清晰的解锁路径

### 3. 用户体验
- 避免过度使用视觉指示器
- 确保指示器不会干扰主要内容
- 提供有意义的错误消息和指导

### 4. 性能优化
- 使用 React.memo 优化组件渲染
- 避免不必要的权限检查
- 合理使用工具提示和覆盖层

### 5. 可访问性
- 确保足够的颜色对比度
- 提供键盘导航支持
- 支持屏幕阅读器
- 遵循 WCAG 指南

## 测试

### 测试页面
访问 `/test-feature-indicators` 查看所有视觉指示器的效果演示。

### 单元测试
每个组件都应该包含以下测试用例：

- 权限检查逻辑
- 视觉状态渲染
- 用户交互处理
- 工具提示显示
- 错误状态处理

### 集成测试
- 与认证系统的集成
- 试用系统的集成
- 路由保护的集成

## 故障排除

### 常见问题

1. **图标不显示**
   - 检查 featureId 是否在配置中存在
   - 确认 lucide-react 已正确安装

2. **工具提示不工作**
   - 确保 TooltipProvider 已包装应用
   - 检查 z-index 层级问题

3. **权限检查失败**
   - 验证 useSmartAuth hook 的实现
   - 检查功能配置是否正确

4. **样式问题**
   - 确认 CSS 文件已正确导入
   - 检查 Tailwind CSS 配置

### 调试技巧

- 使用浏览器开发工具检查组件状态
- 在控制台查看权限检查结果
- 使用 React DevTools 分析组件树
- 检查网络请求和认证状态

## 更新日志

### v1.0.0 (2025-01-03)
- 初始版本发布
- 实现基础视觉指示器组件
- 添加功能按钮和状态显示组件
- 完成样式系统和主题支持
- 创建测试页面和文档