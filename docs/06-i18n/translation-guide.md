# 🌍 国际化开发指南

> 📖 **开发者实施指南** | 基于 [世界级多语言架构设计](./WORLD_CLASS_I18N_ARCHITECTURE.md)

## 🚀 快速开始

### 当前状态
- ✅ **基础多语言支持**: 支持 en-US, zh-CN, ja-JP, ko-KR 四种语言
- ⚠️ **架构重构中**: 正在实施企业级分层翻译架构 ([详见重构计划](../.kiro/specs/i18n-refactor/))
- 🎯 **目标**: 解决语言混乱、性能问题、维护困难

### 使用翻译

```typescript
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.description')}</p>
    </div>
  );
}
```

### 语言切换

```typescript
import { LanguageSwitcher } from '@/components/ui/language-switcher';

// 使用方式
<LanguageSwitcher variant="compact" />
<LanguageSwitcher variant="dropdown" />
```

## 📁 当前文件结构

```
src/i18n/
├── config.ts                   # 国际化配置
└── messages/                   # 翻译文件
    ├── core/                   # 🔥 核心翻译 (已实现)
    │   ├── en-US.json
    │   ├── zh-CN.json
    │   ├── ja-JP.json
    │   └── ko-KR.json
    ├── pages/                  # 📄 页面翻译 (部分实现)
    │   ├── en-US.json
    │   └── zh-CN.json
    ├── features/               # ⚡ 功能翻译 (部分实现)
    │   ├── en-US.json
    │   └── zh-CN.json
    └── [locale].json           # 🔄 兼容性文件 (待迁移)
```

## 🔄 架构重构进行中

### 重构目标
1. **解决语言混乱**: 英文界面显示中文内容的问题
2. **模块化架构**: 分层翻译文件，支持无限扩展
3. **性能优化**: 智能加载，首屏时间减少60%
4. **开发效率**: 新语言添加从2天减少到2小时

### 新架构预览
```
src/i18n/
├── config/                     # 配置系统
│   ├── locales.ts             # 语言配置 (Tier 1-4)
│   ├── namespaces.ts          # 命名空间管理
│   └── loading-strategy.ts    # 智能加载策略
├── messages/                   # 分层翻译文件
│   ├── core/                  # 核心层 (<5KB, 内联加载)
│   ├── pages/                 # 页面层 (<10KB, 路由加载)
│   ├── features/              # 功能层 (<15KB, 懒加载)
│   ├── components/            # 组件层 (<5KB, 组件加载)
│   └── dynamic/               # 动态层 (数据库存储)
├── loaders/                   # 智能加载器
├── hooks/                     # React Hooks
├── utils/                     # 工具函数
└── tools/                     # 开发工具
```

## 🌍 支持的语言

### Tier 1: 核心市场 (100% 支持)
- **en-US**: 英文 - 默认语言
- **zh-CN**: 简体中文 - 中国市场

### Tier 2: 重要市场 (95% 支持)
- **ja-JP**: 日文 - 日本市场
- **ko-KR**: 韩文 - 韩国市场

### 计划扩展
- **de-DE**: 德文
- **fr-FR**: 法文
- **es-ES**: 西班牙文

## 🛠️ 开发指南

### 添加新翻译键

1. **在翻译文件中添加键值**:
```json
// src/i18n/messages/core/zh-CN.json
{
  "common": {
    "newKey": "新的翻译内容"
  }
}
```

2. **在代码中使用**:
```typescript
const t = useTranslations();
const text = t('common.newKey');
```

### 添加新语言

1. **更新语言配置**:
```typescript
// src/i18n/config.ts
export const locales = ['en-US', 'zh-CN', 'ja-JP', 'ko-KR', 'new-LANG'];
```

2. **创建翻译文件**:
```
src/i18n/messages/core/new-LANG.json
src/i18n/messages/pages/new-LANG.json
```

### 翻译文件规范

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "videos": "Videos"
  }
}
```

## 🔧 开发工具

### 验证翻译
```bash
# 检查翻译完整性
npm run i18n:validate

# 提取翻译键
npm run i18n:extract
```

### 类型支持
- ✅ TypeScript 自动补全
- ✅ 编译时键名验证
- ✅ 参数类型检查

## 📊 性能指标

### 当前性能
- 🔄 首屏加载: ~5-8秒 (需优化)
- 🔄 语言切换: ~500ms (需优化)
- 🔄 缓存命中率: ~70% (需优化)

### 重构后目标
- 🎯 首屏加载: <3秒 (减少60%)
- 🎯 语言切换: <100ms
- 🎯 缓存命中率: >95%

## 🚧 已知问题

1. **语言混乱**: 英文界面显示中文内容
2. **性能问题**: 大JSON文件影响加载速度
3. **维护困难**: 单一文件结构难以扩展

> 💡 **解决方案**: 正在实施 [企业级国际化架构重构](../.kiro/specs/i18n-refactor/)

## 📞 获取帮助

- 📖 **架构设计**: [WORLD_CLASS_I18N_ARCHITECTURE.md](./WORLD_CLASS_I18N_ARCHITECTURE.md)
- 🎯 **重构计划**: [i18n-refactor spec](../.kiro/specs/i18n-refactor/)
- 🐛 **问题反馈**: GitHub Issues
- 💬 **技术讨论**: 开发团队

---

**最后更新**: 2025年7月25日  
**状态**: 架构重构中 🚧  
**维护者**: YouTube Analytics Platform Team