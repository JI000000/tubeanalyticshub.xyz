#!/usr/bin/env node

/**
 * 部署准备脚本
 * 检查部署前的必要配置和文件
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 YouTube Analytics Platform - 部署准备检查');
console.log('================================================');

const checks = [
  {
    name: '检查ads.txt文件',
    check: () => fs.existsSync(path.join(__dirname, '../public/ads.txt')),
    fix: '请确保public/ads.txt文件存在'
  },
  {
    name: '检查Google Analytics配置',
    check: () => fs.existsSync(path.join(__dirname, '../src/components/analytics/google-analytics.tsx')),
    fix: '请确保Google Analytics组件存在'
  },
  {
    name: '检查环境变量示例',
    check: () => fs.existsSync(path.join(__dirname, '../.env.example')),
    fix: '请确保.env.example文件存在'
  },
  {
    name: '检查package.json配置',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
      return pkg.name === 'youtube-analytics-platform' && pkg.scripts.build;
    },
    fix: '请检查package.json配置'
  },
  {
    name: '检查.gitignore配置',
    check: () => {
      const gitignore = fs.readFileSync(path.join(__dirname, '../.gitignore'), 'utf8');
      return gitignore.includes('.env*') && gitignore.includes('node_modules');
    },
    fix: '请检查.gitignore配置'
  }
];

let allPassed = true;

checks.forEach((check, index) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  console.log(`${index + 1}. ${status} ${check.name}`);
  
  if (!passed) {
    console.log(`   💡 ${check.fix}`);
    allPassed = false;
  }
});

console.log('\n================================================');

if (allPassed) {
  console.log('🎉 所有检查通过！项目已准备好部署。');
  console.log('\n📋 部署步骤：');
  console.log('1. 确保所有更改已提交到Git');
  console.log('2. 推送到GitHub: git push origin main');
  console.log('3. 在Vercel中配置环境变量');
  console.log('4. 连接GitHub仓库进行自动部署');
  console.log('\n🔗 GitHub仓库: git@github.com:JI000000/tubeanalyticshub.xyz.git');
} else {
  console.log('⚠️  发现问题，请修复后再部署。');
  process.exit(1);
}

console.log('\n🌐 配置信息：');
console.log('- 域名: tubeanalyticshub.xyz');
console.log('- Google Analytics: G-H5407J2EKK');
console.log('- Google AdSense: ca-pub-9751155071098091');
console.log('- ads.txt: google.com, pub-9751155071098091, DIRECT, f08c47fec0942fa0');