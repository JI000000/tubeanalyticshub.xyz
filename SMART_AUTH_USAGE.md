# 智能认证系统使用指南

## 概述

智能认证系统 (`useSmartAuth`) 是一个综合的认证状态管理Hook，它结合了用户认证状态和匿名试用管理，提供智能的登录触发逻辑。

## 核心功能

### 1. 智能功能访问控制
- 自动判断用户是否可以访问特定功能
- 支持试用用户、认证用户和高级用户的不同权限
- 提供详细的访问结果和原因

### 2. 智能登录触发
- 根据不同场景自动触发登录提示
- 支持多种紧急程度和提示样式
- 可配置是否允许跳过登录

### 3. 试用次数管理
- 与匿名试用系统无缝集成
- 自动消耗试用次数
- 试用耗尽时智能引导登录

## 使用方法

### 基础用法

```typescript
import { useSmartAuth } from '@/hooks/useSmartAuth';

function MyComponent() {
  const smartAuth = useSmartAuth();

  // 检查功能访问权限
  const handleVideoAnalysis = async () => {
    const canProceed = await smartAuth.requireAuth('video_analysis', {
      allowTrial: true,
      trialAction: 'video_analysis',
      message: '分析视频需要登录或使用试用次数',
    });

    if (canProceed) {
      // 执行视频分析逻辑
      console.log('开始分析视频...');
    }
  };

  return (
    <div>
      <button onClick={handleVideoAnalysis}>
        分析视频
      </button>
      
      {/* 智能登录模态框 */}
      <SmartLoginModal
        open={smartAuth.showLoginModal}
        onOpenChange={smartAuth.closeLoginModal}
        trigger={smartAuth.loginTrigger}
        context={smartAuth.loginContext}
        onSuccess={smartAuth.handleLoginSuccess}
        onCancel={smartAuth.handleLoginCancel}
        onSkip={smartAuth.handleLoginSkip}
      />
    </div>
  );
}
```

### 功能访问检查

```typescript
// 检查功能访问权限（不触发登录）
const access = smartAuth.checkFeatureAccess('save_report');
if (access.allowed) {
  // 用户可以访问
} else {
  // 用户无法访问，显示相应提示
  console.log(access.message);
}
```

### 手动触发登录

```typescript
// 手动触发特定场景的登录
smartAuth.triggerLogin({
  type: 'save_action',
  message: '保存报告需要登录账户',
  urgency: 'medium',
  allowSkip: true
}, {
  previousAction: 'save_report',
  returnUrl: '/dashboard',
  metadata: { reportId: '123' }
});
```

## 功能权限配置

系统预定义了以下功能权限：

### 基础功能（允许试用）
- `video_analysis` - 视频分析
- `basic_report` - 基础报告生成

### 需要登录的功能
- `save_report` - 保存报告
- `create_project` - 创建项目
- `view_history` - 查看历史
- `export_data` - 导出数据

### 高级功能（需要付费）
- `advanced_analytics` - 高级分析
- `team_collaboration` - 团队协作
- `admin_panel` - 管理面板

## 登录触发场景

### 1. 试用耗尽 (`trial_exhausted`)
```typescript
{
  type: 'trial_exhausted',
  message: '您的免费试用次数已用完，登录后可继续使用所有功能',
  urgency: 'high',
  allowSkip: false
}
```

### 2. 功能需要登录 (`feature_required`)
```typescript
{
  type: 'feature_required',
  message: '此功能需要登录才能使用',
  urgency: 'medium',
  allowSkip: true
}
```

### 3. 保存操作 (`save_action`)
```typescript
{
  type: 'save_action',
  message: '保存功能需要登录，这样您就不会丢失宝贵的分析结果',
  urgency: 'low',
  allowSkip: true
}
```

### 4. 高级功能 (`premium_feature`)
```typescript
{
  type: 'premium_feature',
  message: '这是高级功能，需要登录后才能使用',
  urgency: 'medium',
  allowSkip: true
}
```

## API 参考

### useSmartAuth() 返回值

```typescript
interface SmartAuthHook {
  // 认证状态
  user: any;
  isAuthenticated: boolean;
  loading: boolean;
  
  // 试用状态
  trialStatus: any;
  canUseTrial: boolean;
  trialRemaining: number;
  
  // 登录模态框状态
  showLoginModal: boolean;
  loginTrigger?: LoginTrigger;
  loginContext?: LoginContext;
  
  // 核心方法
  requireAuth: (action: string, options?: RequireAuthOptions) => Promise<boolean>;
  checkFeatureAccess: (feature: string, options?) => FeatureAccess;
  
  // 登录流程控制
  triggerLogin: (trigger: LoginTrigger, context?: LoginContext) => void;
  closeLoginModal: () => void;
  handleLoginSuccess: (result: any) => void;
  handleLoginCancel: () => void;
  handleLoginSkip: () => void;
  
  // 试用管理
  consumeTrial: (action: TrialActionType, metadata?: any) => Promise<boolean>;
  canConsumeTrial: (action: TrialActionType) => boolean;
  
  // 工具方法
  getLoginMessage: (scenario: string, remaining?: number) => string;
  shouldShowTrialIndicator: () => boolean;
  getTrialStatusMessage: () => string;
}
```

### RequireAuthOptions

```typescript
interface RequireAuthOptions {
  allowTrial?: boolean;           // 是否允许试用
  trialAction?: TrialActionType;  // 试用操作类型
  message?: string;               // 自定义登录提示消息
  urgency?: 'low' | 'medium' | 'high';  // 紧急程度
  allowSkip?: boolean;            // 是否允许跳过
  returnUrl?: string;             // 登录成功后的返回URL
  metadata?: any;                 // 额外的元数据
  onSkip?: () => void;           // 跳过回调
  onSuccess?: (result: any) => void;  // 成功回调
  onCancel?: () => void;         // 取消回调
}
```

### FeatureAccess

```typescript
interface FeatureAccess {
  allowed: boolean;               // 是否允许访问
  reason: 'authenticated' | 'trial' | 'blocked' | 'exhausted' | 'premium_required';
  message?: string;               // 访问结果消息
  upgradeRequired?: boolean;      // 是否需要升级
  loginRequired?: boolean;        // 是否需要登录
}
```

## 最佳实践

### 1. 渐进式用户体验
- 优先让用户体验功能，再引导登录
- 在试用次数即将用完时显示温和提示
- 避免在用户刚进入时就要求登录

### 2. 上下文相关的提示
- 根据用户当前操作提供相关的登录理由
- 说明登录后的具体好处
- 提供清晰的价值主张

### 3. 错误处理
- 优雅处理网络错误和认证失败
- 提供重试机制
- 保存用户的操作上下文

### 4. 性能优化
- 避免不必要的状态更新
- 合理使用缓存
- 异步加载非关键组件

## 测试

运行智能认证逻辑测试：

```bash
node test-smart-auth-logic.js
```

访问测试页面：
```
http://localhost:3000/test-smart-auth
```

## 故障排除

### 常见问题

1. **登录模态框不显示**
   - 检查 `SmartLoginModal` 组件是否正确导入和使用
   - 确认 `showLoginModal` 状态是否正确

2. **试用次数不正确**
   - 检查匿名试用系统是否正确初始化
   - 确认指纹识别是否正常工作

3. **功能访问权限不正确**
   - 检查 `FEATURE_PERMISSIONS` 配置
   - 确认用户认证状态是否正确

### 调试技巧

1. 使用测试页面验证功能
2. 检查浏览器控制台的错误信息
3. 使用 React DevTools 查看状态变化
4. 检查网络请求是否正常

## 扩展功能

### 添加新的功能权限

```typescript
// 在 FEATURE_PERMISSIONS 中添加新功能
'new_feature': { 
  requireAuth: true, 
  allowTrial: false, 
  requirePremium: true 
}
```

### 自定义登录消息

```typescript
// 在 LOGIN_MESSAGES 中添加新场景
'custom_scenario': '自定义登录提示消息'
```

### 扩展触发条件

可以根据业务需求添加更多的智能触发条件，如：
- 用户行为分析
- 时间相关的触发
- 地理位置相关的限制
- A/B测试相关的逻辑