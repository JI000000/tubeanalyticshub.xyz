# 试用状态指示器组件文档

## 概述

试用状态指示器组件系统包含两个主要组件：
- `TrialStatusIndicator` - 显示试用状态和渐进式登录提示
- `LoginBenefitsCard` - 展示登录后的权益说明

这些组件实现了智能登录流程中的渐进式用户引导，帮助提高用户转化率。

## TrialStatusIndicator 组件

### 功能特性

1. **多种显示模式**
   - `compact` - 紧凑模式，适合内联显示
   - `detailed` - 详细模式，包含完整信息和权益说明
   - `banner` - 横幅模式，适合页面顶部提醒
   - `tooltip` - 工具提示模式，最小化显示

2. **渐进式提醒**
   - 根据剩余试用次数显示不同紧急程度的提示
   - 支持自动隐藏（试用次数充足时）
   - 智能判断显示时机

3. **状态感知**
   - 自动检测试用状态（正常/即将耗尽/已耗尽/被阻止）
   - 根据状态调整视觉样式和文案
   - 实时更新显示内容

### 使用示例

```tsx
import { TrialStatusIndicator } from '@/components/auth/TrialStatusIndicator';

// 基础使用
<TrialStatusIndicator
  variant="compact"
  onLoginClick={() => setShowLoginModal(true)}
/>

// 详细模式，包含权益说明
<TrialStatusIndicator
  variant="detailed"
  showBenefits={true}
  onLoginClick={() => setShowLoginModal(true)}
/>

// 横幅模式，适合页面顶部
<TrialStatusIndicator
  variant="banner"
  onLoginClick={() => setShowLoginModal(true)}
/>

// 自动隐藏模式
<TrialStatusIndicator
  variant="compact"
  autoHide={true}
  hideThreshold={3}
  onLoginClick={() => setShowLoginModal(true)}
/>
```

### Props 接口

```tsx
interface TrialStatusIndicatorProps {
  /** 显示模式 */
  variant?: 'compact' | 'detailed' | 'banner' | 'tooltip';
  /** 是否显示登录按钮 */
  showLoginButton?: boolean;
  /** 登录按钮点击回调 */
  onLoginClick?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 是否显示权益说明 */
  showBenefits?: boolean;
  /** 是否自动隐藏（当试用次数充足时） */
  autoHide?: boolean;
  /** 隐藏阈值（剩余次数低于此值时显示） */
  hideThreshold?: number;
}
```

## LoginBenefitsCard 组件

### 功能特性

1. **多种展示模式**
   - `card` - 卡片模式，完整的权益展示
   - `list` - 列表模式，紧凑的权益列表
   - `grid` - 网格模式，网格布局展示
   - `minimal` - 最小化模式，简单的内联提示

2. **权益分类**
   - 基础权益：无限制分析、保存报告、历史记录、数据导出
   - 高级权益：高级分析、团队协作、优先支持、API访问

3. **视觉设计**
   - 渐变背景和精美图标
   - 响应式布局
   - 一致的视觉语言

### 使用示例

```tsx
import { LoginBenefitsCard } from '@/components/auth/LoginBenefitsCard';

// 基础卡片模式
<LoginBenefitsCard
  variant="card"
  onLoginClick={() => setShowLoginModal(true)}
/>

// 列表模式
<LoginBenefitsCard
  variant="list"
  onLoginClick={() => setShowLoginModal(true)}
/>

// 包含高级功能
<LoginBenefitsCard
  variant="card"
  showPremiumFeatures={true}
  title="升级到专业版"
  description="解锁所有高级功能"
  onLoginClick={() => setShowLoginModal(true)}
/>

// 最小化模式
<LoginBenefitsCard
  variant="minimal"
  onLoginClick={() => setShowLoginModal(true)}
/>
```

### Props 接口

```tsx
interface LoginBenefitsCardProps {
  /** 显示变体 */
  variant?: 'card' | 'list' | 'grid' | 'minimal';
  /** 是否显示登录按钮 */
  showLoginButton?: boolean;
  /** 登录按钮点击回调 */
  onLoginClick?: () => void;
  /** 自定义样式类名 */
  className?: string;
  /** 标题文本 */
  title?: string;
  /** 描述文本 */
  description?: string;
  /** 是否显示高级功能 */
  showPremiumFeatures?: boolean;
}
```

## 设计原则

### 1. 渐进式引导
- 根据用户的试用状态智能调整提示强度
- 避免过早或过于频繁的登录提示
- 在合适的时机展示登录价值

### 2. 视觉层次
- 使用颜色和图标区分不同紧急程度
- 保持一致的视觉语言和品牌风格
- 确保可访问性和易读性

### 3. 用户体验
- 提供清晰的价值主张
- 减少用户的认知负担
- 支持多种使用场景和布局需求

## 集成指南

### 1. 页面顶部横幅
```tsx
// 在页面顶部显示试用状态
<TrialStatusIndicator
  variant="banner"
  onLoginClick={handleLoginClick}
/>
```

### 2. 功能按钮旁提示
```tsx
// 在需要登录的功能旁显示提示
<div className="flex items-center gap-3">
  <Button onClick={handleAnalyze}>分析视频</Button>
  <TrialStatusIndicator
    variant="compact"
    onLoginClick={handleLoginClick}
  />
</div>
```

### 3. 侧边栏权益说明
```tsx
// 在侧边栏显示登录权益
<aside className="w-64">
  <LoginBenefitsCard
    variant="list"
    onLoginClick={handleLoginClick}
  />
</aside>
```

### 4. 模态框内权益展示
```tsx
// 在登录模态框中展示权益
<SmartLoginModal>
  <LoginBenefitsCard
    variant="grid"
    showLoginButton={false}
  />
</SmartLoginModal>
```

## 最佳实践

### 1. 时机选择
- 在用户尝试使用核心功能时显示
- 避免在页面加载时立即显示
- 根据用户行为智能判断显示时机

### 2. 文案策略
- 使用积极正面的语言
- 强调登录后的好处而非限制
- 保持文案简洁明了

### 3. 视觉设计
- 与整体设计风格保持一致
- 使用合适的颜色表达紧急程度
- 确保在不同设备上的显示效果

### 4. 性能优化
- 组件支持懒加载
- 避免不必要的重新渲染
- 合理使用缓存机制

## 测试建议

### 1. 功能测试
- 测试不同试用状态下的显示效果
- 验证登录按钮的点击行为
- 检查自动隐藏功能的正确性

### 2. 视觉测试
- 在不同屏幕尺寸下测试布局
- 验证颜色对比度和可访问性
- 检查动画效果的流畅性

### 3. 用户体验测试
- 收集用户对提示时机的反馈
- 测试不同文案的转化效果
- 分析用户的点击行为数据

## 扩展性

### 1. 自定义主题
组件支持通过 CSS 变量自定义主题色彩：

```css
:root {
  --trial-low-color: #3b82f6;
  --trial-medium-color: #f59e0b;
  --trial-high-color: #ef4444;
}
```

### 2. 国际化支持
组件预留了国际化接口，可以轻松添加多语言支持：

```tsx
// 未来可以集成 i18n
const { t } = useTranslation();
```

### 3. 分析集成
组件支持集成分析工具，跟踪用户行为：

```tsx
<TrialStatusIndicator
  onLoginClick={() => {
    analytics.track('trial_login_clicked');
    handleLoginClick();
  }}
/>
```