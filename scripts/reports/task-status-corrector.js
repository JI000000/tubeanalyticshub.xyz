#!/usr/bin/env node

/**
 * 任务状态修正脚本
 * 基于代码检视结果，修正任务列表中的虚假完成标记
 */

const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(__dirname, '../../../.kiro/specs/youtube-scraper/tasks.md');
const BACKUP_FILE = path.join(__dirname, '../../../.kiro/specs/youtube-scraper/tasks_backup_before_correction.md');

// 真实完成状态映射
const REAL_STATUS_CORRECTIONS = {
  // Phase 1 - Analytics Platform核心功能
  '1.1.1 创建yt_dashboards表': '✅ 完成',
  '1.1.2 创建yt_reports表': '✅ 完成',
  '1.1.3 创建yt_ai_insights表': '✅ 完成',
  '1.1.4 创建yt_competitor_analysis表': '✅ 完成',
  '1.2.1 扩展yt_users表': '✅ 完成',
  '1.2.2 优化yt_videos表': '✅ 完成',
  
  // Analytics API - 基础实现
  '2.1.1 实现POST /api/analytics/dashboard': '⚠️ 基础实现',
  '2.1.2 实现GET /api/analytics/dashboard/:id': '⚠️ 基础实现',
  '2.1.3 实现PUT /api/analytics/dashboard/:id': '❌ 未实现',
  '2.2.1 实现POST /api/analytics/reports': '⚠️ 基础实现',
  '2.2.2 实现GET /api/analytics/reports/:id': '⚠️ 基础实现',
  '2.2.3 实现POST /api/analytics/reports/:id/share': '❌ 未实现',
  '2.3.1 实现POST /api/analytics/insights': '⚠️ 基础实现',
  '2.3.2 实现POST /api/analytics/competitor': '⚠️ 基础实现',
  '2.3.3 实现趋势预测功能': '❌ 未实现',
  
  // 前端界面 - 部分实现
  '3.1.1 开发主仪表板页面': '⚠️ 基础实现',
  '3.1.2 开发仪表板配置界面': '❌ 未实现',
  '3.1.3 开发数据钻取和筛选功能': '❌ 未实现',
  '3.2.1 开发报告模板选择页面': '⚠️ 基础实现',
  '3.2.2 开发报告编辑和定制界面': '❌ 未实现',
  '3.2.3 开发报告预览和导出界面': '❌ 未实现',
  '3.3.1 开发AI洞察面板组件': '⚠️ 基础实现',
  '3.3.2 开发竞品分析对比界面': '⚠️ 基础实现',
  '3.3.3 开发趋势预测可视化': '❌ 未实现',
  
  // Phase 2 - 高级功能 (大部分未实现)
  '4.1.1 集成next-intl国际化框架': '❌ 配置不完整',
  '4.1.2 创建多语言资源文件': '❌ 严重不完整',
  '4.1.3 实现语言切换界面': '❌ 功能不完善',
  
  // 团队协作功能 - 基本未实现
  '5.1.1 创建yt_team_members表和API': '❌ 空实现',
  '5.1.2 开发团队邀请和管理界面': '❌ 未实现',
  '5.1.3 实现协作权限控制': '❌ 未实现',
  '5.2.1 创建yt_collaboration_comments表': '❌ 未实现',
  '5.2.2 开发实时评论和标注系统': '❌ 未实现',
  '5.2.3 开发协作历史和版本控制': '❌ 未实现',
  
  // 智能内容推荐系统 - 完全未实现
  '6.1.1 创建内容推荐相关数据表': '❌ 完全未实现',
  '6.1.2 实现推荐数据收集API': '❌ 完全未实现',
  '6.1.3 构建推荐算法基础框架': '❌ 完全未实现',
  '6.2.1 开发主题推荐算法': '❌ 完全未实现',
  '6.2.2 实现关键词和标签推荐': '❌ 完全未实现',
  '6.2.3 构建发布时机优化系统': '❌ 完全未实现',
  '6.3.1 创建内容建议展示组件': '❌ 完全未实现',
  '6.3.2 开发内容日历界面': '❌ 完全未实现',
  '6.3.3 实现A/B测试建议界面': '❌ 完全未实现'
};

// 需要添加的缺失任务状态说明
const MISSING_TASKS_NOTES = `

## ⚠️ 代码检视发现的问题

### 虚假完成标记问题
经过2025年7月31日的完整代码检视，发现以下严重问题：

1. **智能内容推荐系统 (6.1-6.3)**: 标记为"✅ 完成"但**完全未实现**
   - 无相关数据表
   - 无API实现
   - 无前端界面
   - 无推荐算法

2. **多语言国际化 (4.1-4.3)**: 标记为"✅ 完成"但**严重不完整**
   - 配置不完整
   - 大量硬编码中文文本
   - 语言切换功能缺陷

3. **团队协作功能 (5.1-5.2)**: 标记为"✅ 完成"但**基本未实现**
   - API为空实现
   - 无前端界面
   - 无实际功能

4. **高级Analytics功能**: 多个API标记完成但实际只有基础实现
   - 缺少完整的CRUD操作
   - 缺少高级功能
   - 前后端不匹配

### 真实项目完成度
- **声称完成度**: 85-100%
- **实际完成度**: 40-50%
- **核心功能**: 基本可用但不完整
- **高级功能**: 大部分未实现

### 紧急行动项
1. 立即修正任务状态标记
2. 重新制定现实的项目时间线
3. 优先完善核心功能
4. 建立代码质量检查机制

---
*检视报告详见: docs/10-task-status/code-review-reality-check-2025-07-31T06-00-00Z.md*
`;

function correctTaskStatus() {
  try {
    console.log('🔍 开始修正任务状态...');
    
    // 读取原始任务文件
    if (!fs.existsSync(TASKS_FILE)) {
      console.error('❌ 任务文件不存在:', TASKS_FILE);
      return;
    }
    
    let content = fs.readFileSync(TASKS_FILE, 'utf8');
    
    // 创建备份
    fs.writeFileSync(BACKUP_FILE, content);
    console.log('✅ 已创建备份文件:', BACKUP_FILE);
    
    // 应用状态修正
    let correctionCount = 0;
    
    Object.entries(REAL_STATUS_CORRECTIONS).forEach(([taskDescription, newStatus]) => {
      // 查找并替换任务状态
      const patterns = [
        new RegExp(`(- \\[x\\]\\s+${taskDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s+-\\s+✅\\s+完成`, 'g'),
        new RegExp(`(- \\[x\\]\\s+${taskDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s+-\\s+⚠️\\s+[^\\n]*`, 'g'),
        new RegExp(`(- \\[x\\]\\s+${taskDescription.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s+-\\s+❌\\s+[^\\n]*`, 'g')
      ];
      
      patterns.forEach(pattern => {
        if (pattern.test(content)) {
          content = content.replace(pattern, `$1 - ${newStatus}`);
          correctionCount++;
          console.log(`✏️  修正: ${taskDescription} -> ${newStatus}`);
        }
      });
    });
    
    // 添加检视说明
    if (!content.includes('代码检视发现的问题')) {
      content += MISSING_TASKS_NOTES;
      console.log('📝 已添加代码检视说明');
    }
    
    // 更新项目状态总览
    content = content.replace(
      /\*\*项目状态\*\*: Analytics Platform核心功能已完成，进入高级功能开发阶段 🎯/g,
      '**项目状态**: 核心功能基础实现完成，需要完善和修复 ⚠️'
    );
    
    content = content.replace(
      /\*\*当前阶段\*\*: Phase 2 - 高级功能开发 \(85%完成\) 🚀/g,
      '**当前阶段**: Phase 1 - 核心功能完善 (45%完成) ⚠️'
    );
    
    // 写入修正后的文件
    fs.writeFileSync(TASKS_FILE, content);
    
    console.log(`\n✅ 任务状态修正完成!`);
    console.log(`📊 修正了 ${correctionCount} 个任务状态`);
    console.log(`📁 原文件已备份至: ${BACKUP_FILE}`);
    console.log(`📄 修正后文件: ${TASKS_FILE}`);
    
    // 生成修正报告
    const reportPath = path.join(__dirname, '../reports', `task-correction-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    const report = generateCorrectionReport(correctionCount);
    fs.writeFileSync(reportPath, report);
    console.log(`📋 修正报告已生成: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ 修正过程中出错:', error);
  }
}

function generateCorrectionReport(correctionCount) {
  return `# 任务状态修正报告

**修正时间**: ${new Date().toISOString()}
**修正数量**: ${correctionCount} 个任务

## 修正概述

基于2025年7月31日的完整代码检视，对任务列表中的虚假完成标记进行了系统性修正。

## 主要修正类别

### 1. 智能内容推荐系统
- **原状态**: ✅ 完成
- **实际状态**: ❌ 完全未实现
- **问题**: 无任何相关代码实现

### 2. 多语言国际化
- **原状态**: ✅ 完成  
- **实际状态**: ❌ 严重不完整
- **问题**: 配置不完整，大量硬编码文本

### 3. 团队协作功能
- **原状态**: ✅ 完成
- **实际状态**: ❌ 基本未实现
- **问题**: API空实现，无前端界面

### 4. Analytics API
- **原状态**: ✅ 完成
- **实际状态**: ⚠️ 基础实现
- **问题**: 功能不完整，缺少高级特性

## 修正后的项目状态

- **真实完成度**: 45% (原声称85%)
- **核心功能**: 基础可用
- **高级功能**: 大部分未实现
- **项目阶段**: Phase 1 - 核心功能完善

## 后续行动

1. 基于真实状态制定恢复计划
2. 优先完善核心功能
3. 建立代码质量检查机制
4. 定期进行状态核查

---
*详细检视报告: docs/10-task-status/code-review-reality-check-2025-07-31T06-00-00Z.md*
`;
}

// 执行修正
if (require.main === module) {
  correctTaskStatus();
}

module.exports = { correctTaskStatus };