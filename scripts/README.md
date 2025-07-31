# 📁 Scripts 目录结构

本目录包含YouTube Analytics Platform的所有脚本工具，按功能分类组织。

## 🗂️ 目录结构

```
scripts/
├── i18n/                   # 🌍 国际化相关脚本
│   ├── i18n-toolkit.js     # 🌍 统一入口工具
│   ├── i18n-manager.js     # 主管理工具 (检测、修复、验证)
│   ├── i18n-validator.js   # 验证脚本 (硬编码检查)
│   ├── i18n-quality-checker.js # 英文质量检查
│   ├── i18n-cleanup.js     # 智能脚本清理
│   └── reports/            # 📊 i18n报告文件目录
├── database/               # 🗄️ 数据库相关脚本
│   ├── init-database.js    # 数据库初始化
│   └── manual-db-setup.md  # 手动设置指南
├── analytics/              # 📊 分析功能脚本
│   └── test-analytics-api.js # API测试
├── utils/                  # 🛠️ 通用工具脚本
│   ├── test-youtube-api.js # YouTube API测试
│   ├── dev-setup.js        # 开发环境检查
│   ├── check-file-organization.js # 文件组织规范检查
│   └── check-file-organization-enhanced.js # 增强版组织检查
├── legacy/                 # 📦 遗留脚本 (不推荐使用)
│   ├── turbo-fix-final-cleanup.js
│   └── reference/          # 📚 参考脚本目录
│       ├── i18n-master-toolkit.js
│       ├── i18n-unified-manager.js
│       ├── turbo-fix-i18n.js
│       └── README.md
└── README.md              # 本文件
```

## 🚀 使用指南

### 🎯 统一入口工具 (推荐)
```bash
# 使用统一工具包 - 最简单的方式
node scripts/i18n/i18n-toolkit.js <命令>

# 查看系统状态
node scripts/i18n/i18n-toolkit.js status

# 完整工作流
node scripts/i18n/i18n-toolkit.js check     # 检查问题
node scripts/i18n/i18n-toolkit.js fix       # 修复问题
node scripts/i18n/i18n-toolkit.js enhance   # 提升质量
node scripts/i18n/i18n-toolkit.js translate # 补全翻译
node scripts/i18n/i18n-toolkit.js validate  # 验证结果
```

### 国际化脚本 (i18n/) - 直接调用
```bash
# 检查硬编码问题
node scripts/i18n/i18n-manager.js check

# 修复硬编码问题
node scripts/i18n/i18n-manager.js fix

# 验证翻译完整性
node scripts/i18n/i18n-validator.js

# 检查英文质量
node scripts/i18n/i18n-quality-checker.js

# 提升翻译质量
node scripts/i18n/i18n-quality-enhancer.js

# 自动翻译
node scripts/i18n/i18n-auto-translator.js
```

### 数据库脚本 (database/)
```bash
# 初始化数据库
node scripts/database/init-database.js
```

### 分析脚本 (analytics/)
```bash
# 测试分析API
node scripts/analytics/test-analytics-api.js
```

### 工具脚本 (utils/)
```bash
# 测试YouTube API连接
node scripts/utils/test-youtube-api.js

# 检查开发环境配置
node scripts/utils/dev-setup.js

# 检查文件组织规范
node scripts/utils/check-file-organization.js

# 增强版文件组织检查 (包含docs目录检查)
node scripts/utils/check-file-organization-enhanced.js
```

## ⚠️ 注意事项

1. **legacy/** 目录中的脚本已过时，不推荐使用
2. 新脚本应按功能分类放入对应目录
3. 每个脚本都应包含详细的使用说明
4. 删除脚本前请先移动到legacy目录

## 📝 脚本命名规范

- **i18n脚本**: `i18n-功能名.js`
- **数据库脚本**: `db-功能名.js` 或 `init-功能名.js`
- **分析脚本**: `analytics-功能名.js` 或 `test-功能名.js`
- **工具脚本**: `util-功能名.js`

---

**最后更新**: 2025年7月28日  
**维护者**: YouTube Analytics Platform Team