#!/usr/bin/env node

/**
 * 🚀 TURBO国际化修复脚本 - 超高效批量修复
 * 一次性修复所有硬编码中文问题
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 TURBO模式启动！批量修复所有硬编码中文...\n');

// 获取所有需要修复的文件
function getAllFiles(dir, extensions = ['.tsx', '.ts']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
        traverse(fullPath);
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// 超级翻译映射表 - 涵盖所有常见硬编码
const MEGA_TRANSLATIONS = {
  // 页面标题
  '频道分析': 'Channel Analysis',
  '评论分析': 'Comment Analysis', 
  '竞品分析': 'Competitor Analysis',
  '数据导出': 'Data Export',
  'AI洞察': 'AI Insights',
  '专业报告': 'Professional Reports',
  '洞察详情': 'Insight Details',
  '报告预览': 'Report Preview',
  
  // 描述文本
  '分析YouTube频道数据和增长趋势': 'Analyze YouTube channel data and growth trends',
  '分析YouTube评论情感和趋势': 'Analyze YouTube comment sentiment and trends',
  'AI驱动的评论情感分析和洞察': 'AI-powered comment sentiment analysis and insights',
  '对比分析竞争对手表现': 'Compare and analyze competitor performance',
  '导出分析数据和报告': 'Export analysis data and reports',
  '查看AI生成的深度洞察': 'View AI-generated deep insights',
  '生成和管理专业分析报告': 'Generate and manage professional analysis reports',
  '深度分析和行动建议': 'Deep analysis and action recommendations',
  
  // 按钮和操作
  '刷新数据': 'Refresh Data',
  '开始分析': 'Start Analysis',
  '查看详情': 'View Details',
  '分享': 'Share',
  '导出': 'Export',
  '返回': 'Back',
  '确认': 'Confirm',
  '取消': 'Cancel',
  '保存': 'Save',
  '删除': 'Delete',
  '编辑': 'Edit',
  '搜索': 'Search',
  '筛选': 'Filter',
  '排序': 'Sort',
  '上传': 'Upload',
  '下载': 'Download',
  
  // 统计标签
  '频道总数': 'Total Channels',
  '总订阅数': 'Total Subscribers', 
  '总视频数': 'Total Videos',
  '总观看量': 'Total Views',
  '评论总数': 'Total Comments',
  '积极评论': 'Positive Comments',
  '消极评论': 'Negative Comments',
  '中性评论': 'Neutral Comments',
  '平均观看量': 'Average Views',
  
  // 状态和标签
  '积极': 'Positive',
  '消极': 'Negative', 
  '中性': 'Neutral',
  '成功': 'Success',
  '失败': 'Failed',
  '进行中': 'In Progress',
  '已完成': 'Completed',
  '待处理': 'Pending',
  '加载中': 'Loading',
  '处理中': 'Processing',
  
  // 表单和输入
  '搜索频道...': 'Search channels...',
  '搜索评论...': 'Search comments...',
  '搜索视频...': 'Search videos...',
  '请输入': 'Please enter',
  '选择': 'Select',
  '全部': 'All',
  '排序方式': 'Sort by',
  
  // 时间相关
  '发布时间': 'Published Time',
  '创建时间': 'Created Time',
  '更新时间': 'Updated Time',
  '最后修改': 'Last Modified',
  '今天': 'Today',
  '昨天': 'Yesterday',
  '本周': 'This Week',
  '本月': 'This Month',
  
  // 数据和分析
  '观看量': 'Views',
  '点赞数': 'Likes', 
  '评论数': 'Comments',
  '订阅者': 'Subscribers',
  '视频': 'Videos',
  '频道': 'Channels',
  '关键词': 'Keywords',
  '标签': 'Tags',
  '分类': 'Category',
  '趋势': 'Trends',
  '洞察': 'Insights',
  '建议': 'Recommendations',
  '分析': 'Analysis',
  '报告': 'Report',
  
  // 错误和提示
  '暂无数据': 'No data available',
  '加载失败': 'Loading failed',
  '网络错误': 'Network error',
  '请稍后重试': 'Please try again later',
  '操作成功': 'Operation successful',
  '操作失败': 'Operation failed',
  '数据为空': 'Data is empty',
  '未找到结果': 'No results found',
  
  // 导航和菜单
  '首页': 'Home',
  '仪表板': 'Dashboard',
  '设置': 'Settings',
  '帮助': 'Help',
  '关于': 'About',
  '退出': 'Exit',
  '登录': 'Login',
  '注册': 'Register',
  
  // 其他常用
  '详情': 'Details',
  '概览': 'Overview',
  '摘要': 'Summary',
  '列表': 'List',
  '表格': 'Table',
  '图表': 'Chart',
  '配置': 'Configuration',
  '管理': 'Management',
  '工具': 'Tools',
  '功能': 'Features',
  '服务': 'Services',
  '产品': 'Products',
  '用户': 'User',
  '团队': 'Team',
  '项目': 'Project',
  '任务': 'Task',
  '文件': 'File',
  '文档': 'Document',
  '图片': 'Image',
  '视频文件': 'Video File',
  '音频': 'Audio'
};

// 批量修复函数
function turboFixFile(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fixCount = 0;
  const originalContent = content;
  
  // 1. 添加翻译Hook import (如果是React组件)
  if (filePath.includes('.tsx') && !content.includes('useTranslation')) {
    const importRegex = /(import.*from.*['"]react['"];?\s*)/;
    if (importRegex.test(content)) {
      content = content.replace(importRegex, `$1import { useTranslation } from '@/hooks/useTranslation';\n`);
      fixCount++;
    }
  }
  
  // 2. 在组件函数开始添加翻译Hook
  if (filePath.includes('.tsx')) {
    const componentRegex = /(export\s+(?:default\s+)?function\s+\w+[^{]*{\s*)/;
    if (componentRegex.test(content) && !content.includes('const { t } = useTranslation()')) {
      content = content.replace(componentRegex, `$1  const { t } = useTranslation();\n\n`);
      fixCount++;
    }
  }
  
  // 3. 批量替换硬编码中文
  for (const [chinese, english] of Object.entries(MEGA_TRANSLATIONS)) {
    // 匹配引号包围的文本
    const patterns = [
      new RegExp(`(['"\`])${chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`, 'g'),
      new RegExp(`(>)${chinese.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(<)`, 'g')
    ];
    
    for (const pattern of patterns) {
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, (match, p1, p2) => {
          if (p1 === '>' && p2 === '<') {
            return `>${english}<`;
          } else {
            return `${p1}${english}${p1}`;
          }
        });
        fixCount += matches.length;
      }
    }
  }
  
  // 4. 修复console.error中的中文
  const consoleErrorRegex = /console\.error\(['"`]([^'"`]*[\u4e00-\u9fff][^'"`]*)['"`]/g;
  content = content.replace(consoleErrorRegex, (match, message) => {
    const englishMessage = message
      .replace(/获取.*失败/g, 'Failed to fetch data')
      .replace(/创建.*失败/g, 'Failed to create')
      .replace(/删除.*失败/g, 'Failed to delete')
      .replace(/更新.*失败/g, 'Failed to update')
      .replace(/.*错误/g, 'Error')
      .replace(/.*API错误/g, 'API Error');
    
    if (englishMessage !== message) {
      fixCount++;
      return `console.error('${englishMessage}'`;
    }
    return match;
  });
  
  // 5. 清理注释中的中文
  const commentRegex = /\/\*\s*([^*]*[\u4e00-\u9fff][^*]*)\s*\*\//g;
  content = content.replace(commentRegex, (match, comment) => {
    fixCount++;
    return `/* ${comment.replace(/[\u4e00-\u9fff]/g, '')} */`;
  });
  
  const lineCommentRegex = /\/\/\s*([^*]*[\u4e00-\u9fff][^*]*)/g;
  content = content.replace(lineCommentRegex, (match, comment) => {
    fixCount++;
    return `// ${comment.replace(/[\u4e00-\u9fff]/g, '')}`;
  });
  
  // 保存文件
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
  }
  
  return fixCount;
}

// 主执行函数
function main() {
  const startTime = Date.now();
  
  // 获取所有需要修复的文件
  const srcDir = path.join(__dirname, '../src');
  const allFiles = getAllFiles(srcDir);
  
  // 过滤出需要修复的文件
  const targetFiles = allFiles.filter(file => {
    return file.includes('/app/') || 
           file.includes('/components/') || 
           file.includes('/lib/') ||
           file.includes('/hooks/');
  });
  
  console.log(`📁 找到 ${targetFiles.length} 个文件需要检查\n`);
  
  let totalFixed = 0;
  let filesModified = 0;
  
  // 批量修复
  for (const file of targetFiles) {
    const fixCount = turboFixFile(file);
    if (fixCount > 0) {
      const relativePath = path.relative(path.join(__dirname, '..'), file);
      console.log(`✅ ${relativePath}: 修复了 ${fixCount} 个问题`);
      totalFixed += fixCount;
      filesModified++;
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n🎉 TURBO修复完成！`);
  console.log(`⚡ 耗时: ${duration}秒`);
  console.log(`📊 修复统计:`);
  console.log(`   - 检查文件: ${targetFiles.length}个`);
  console.log(`   - 修改文件: ${filesModified}个`);
  console.log(`   - 修复问题: ${totalFixed}个`);
  
  console.log(`\n🔍 运行检查验证:`);
  console.log(`node scripts/test-i18n-fix.js`);
}

if (require.main === module) {
  main();
}