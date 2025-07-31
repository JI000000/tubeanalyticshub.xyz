#!/usr/bin/env node

/**
 * 📊 翻译质量实时监控系统
 * 
 * 功能:
 * 1. 实时监控翻译文件变化
 * 2. 自动质量评估
 * 3. 异常告警
 * 4. 使用统计分析
 * 5. 性能监控
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar'); // 需要安装: npm install chokidar

class TranslationMonitor {
  constructor() {
    this.i18nDir = path.join(__dirname, '../../src/i18n/messages');
    this.monitoringData = this.loadMonitoringData();
    this.watchers = new Map();
    this.alerts = [];
    
    // 监控配置
    this.config = {
      qualityThreshold: 0.8, // 质量阈值
      maxMissingKeys: 10,    // 最大缺失键数量
      alertCooldown: 300000, // 告警冷却时间 (5分钟)
      languages: ['en-US', 'zh-CN', 'ja-JP', 'ko-KR', 'de-DE', 'fr-FR', 'es-ES']
    };
    
    // 质量指标
    this.metrics = {
      translationCompleteness: {},
      qualityScores: {},
      lastUpdated: {},
      errorCounts: {},
      usageStats: {}
    };
  }

  /**
   * 启动监控
   */
  async startMonitoring() {
    console.log('📊 启动翻译质量实时监控系统\n');
    
    // 初始化监控数据
    await this.initializeMetrics();
    
    // 启动文件监控
    this.startFileWatching();
    
    // 启动定期检查
    this.startPeriodicChecks();
    
    // 启动Web监控面板 (可选)
    if (process.env.ENABLE_WEB_MONITOR === 'true') {
      this.startWebMonitor();
    }
    
    console.log('✅ 监控系统已启动');
    console.log('📈 实时监控翻译质量变化');
    console.log('🚨 自动检测异常并告警');
    
    // 显示初始状态
    this.displayCurrentStatus();
    
    // 保持进程运行
    process.on('SIGINT', () => {
      console.log('\n🛑 正在停止监控系统...');
      this.stopMonitoring();
      process.exit(0);
    });
  }

  /**
   * 初始化监控指标
   */
  async initializeMetrics() {
    console.log('🔄 初始化监控指标...');
    
    for (const language of this.config.languages) {
      await this.updateLanguageMetrics(language);
    }
    
    console.log('✅ 监控指标初始化完成\n');
  }

  /**
   * 启动文件监控
   */
  startFileWatching() {
    const watchPattern = path.join(this.i18nDir, '**/*.json');
    
    const watcher = chokidar.watch(watchPattern, {
      ignored: /node_modules/,
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('change', (filePath) => this.handleFileChange(filePath))
      .on('add', (filePath) => this.handleFileAdd(filePath))
      .on('unlink', (filePath) => this.handleFileDelete(filePath))
      .on('error', (error) => this.handleWatchError(error));

    this.watchers.set('main', watcher);
    console.log('👁️  文件监控已启动');
  }

  /**
   * 启动定期检查
   */
  startPeriodicChecks() {
    // 每5分钟进行一次完整检查
    setInterval(() => {
      this.performFullCheck();
    }, 5 * 60 * 1000);

    // 每小时生成监控报告
    setInterval(() => {
      this.generateHourlyReport();
    }, 60 * 60 * 1000);

    console.log('⏰ 定期检查已启动');
  }

  /**
   * 处理文件变化
   */
  async handleFileChange(filePath) {
    const language = this.extractLanguageFromPath(filePath);
    if (!language) return;

    console.log(`📝 检测到文件变化: ${path.relative(this.i18nDir, filePath)}`);
    
    try {
      // 更新指标
      await this.updateLanguageMetrics(language);
      
      // 检查质量
      const quality = await this.checkTranslationQuality(filePath);
      
      // 记录变化
      this.recordChange(language, 'file_changed', { filePath, quality });
      
      // 检查是否需要告警
      this.checkForAlerts(language, quality);
      
    } catch (error) {
      console.error(`❌ 处理文件变化失败: ${error.message}`);
      this.recordError(language, error);
    }
  }

  /**
   * 处理文件添加
   */
  async handleFileAdd(filePath) {
    const language = this.extractLanguageFromPath(filePath);
    if (!language) return;

    console.log(`➕ 检测到新文件: ${path.relative(this.i18nDir, filePath)}`);
    await this.updateLanguageMetrics(language);
    this.recordChange(language, 'file_added', { filePath });
  }

  /**
   * 处理文件删除
   */
  async handleFileDelete(filePath) {
    const language = this.extractLanguageFromPath(filePath);
    if (!language) return;

    console.log(`🗑️  检测到文件删除: ${path.relative(this.i18nDir, filePath)}`);
    this.recordChange(language, 'file_deleted', { filePath });
    
    // 发送告警
    this.sendAlert('warning', `翻译文件被删除: ${filePath}`, { language, filePath });
  }

  /**
   * 更新语言指标
   */
  async updateLanguageMetrics(language) {
    try {
      const files = this.findTranslationFiles(language);
      let totalKeys = 0;
      let validKeys = 0;
      let qualityScore = 0;

      for (const file of files) {
        const content = JSON.parse(fs.readFileSync(file, 'utf8'));
        const keys = this.flattenObject(content);
        totalKeys += Object.keys(keys).length;

        // 检查有效键
        for (const [key, value] of Object.entries(keys)) {
          if (typeof value === 'string' && value.trim().length > 0) {
            validKeys++;
          }
        }

        // 计算质量分数
        qualityScore += await this.calculateFileQuality(file, keys);
      }

      // 更新指标
      this.metrics.translationCompleteness[language] = totalKeys > 0 ? (validKeys / totalKeys) : 0;
      this.metrics.qualityScores[language] = files.length > 0 ? (qualityScore / files.length) : 0;
      this.metrics.lastUpdated[language] = new Date().toISOString();

    } catch (error) {
      this.recordError(language, error);
    }
  }

  /**
   * 检查翻译质量
   */
  async checkTranslationQuality(filePath) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const keys = this.flattenObject(content);
      return await this.calculateFileQuality(filePath, keys);
    } catch (error) {
      return 0;
    }
  }

  /**
   * 计算文件质量
   */
  async calculateFileQuality(filePath, keys) {
    let qualityScore = 1.0;
    let issues = 0;

    for (const [key, value] of Object.entries(keys)) {
      if (typeof value !== 'string') {
        issues++;
        continue;
      }

      // 检查空值
      if (!value.trim()) {
        issues++;
        continue;
      }

      // 检查占位符格式
      if (value.includes('[') && value.includes(']')) {
        issues += 0.5;
      }

      // 检查重复内容
      if (value === key) {
        issues += 0.3;
      }
    }

    const totalKeys = Object.keys(keys).length;
    if (totalKeys > 0) {
      qualityScore = Math.max(0, 1 - (issues / totalKeys));
    }

    return qualityScore;
  }

  /**
   * 检查告警条件
   */
  checkForAlerts(language, quality) {
    const completeness = this.metrics.translationCompleteness[language] || 0;
    const lastAlert = this.getLastAlert(language);
    const now = Date.now();

    // 检查冷却时间
    if (lastAlert && (now - lastAlert.timestamp) < this.config.alertCooldown) {
      return;
    }

    // 质量告警
    if (quality < this.config.qualityThreshold) {
      this.sendAlert('warning', `翻译质量下降`, {
        language,
        quality: (quality * 100).toFixed(1) + '%',
        threshold: (this.config.qualityThreshold * 100).toFixed(1) + '%'
      });
    }

    // 完整性告警
    if (completeness < 0.9) {
      this.sendAlert('warning', `翻译完整性不足`, {
        language,
        completeness: (completeness * 100).toFixed(1) + '%'
      });
    }
  }

  /**
   * 发送告警
   */
  sendAlert(level, message, data = {}) {
    const alert = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    this.alerts.push(alert);
    
    // 控制台输出
    const emoji = level === 'error' ? '🚨' : level === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${emoji} [${level.toUpperCase()}] ${message}`);
    
    if (Object.keys(data).length > 0) {
      console.log('   详情:', JSON.stringify(data, null, 2));
    }

    // 可以集成其他告警渠道
    this.sendToExternalChannels(alert);
    
    // 保存告警历史
    this.saveAlert(alert);
  }

  /**
   * 发送到外部渠道 (邮件、Slack等)
   */
  sendToExternalChannels(alert) {
    // 这里可以集成邮件、Slack、钉钉等告警渠道
    if (process.env.SLACK_WEBHOOK_URL) {
      this.sendToSlack(alert);
    }
    
    if (process.env.EMAIL_ALERT_ENABLED === 'true') {
      this.sendEmailAlert(alert);
    }
  }

  /**
   * 发送到Slack
   */
  async sendToSlack(alert) {
    try {
      const payload = {
        text: `翻译监控告警: ${alert.message}`,
        attachments: [{
          color: alert.level === 'error' ? 'danger' : 'warning',
          fields: Object.entries(alert.data).map(([key, value]) => ({
            title: key,
            value: value,
            short: true
          }))
        }]
      };

      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Slack告警发送失败:', error.message);
    }
  }

  /**
   * 执行完整检查
   */
  async performFullCheck() {
    console.log('🔍 执行定期完整检查...');
    
    for (const language of this.config.languages) {
      await this.updateLanguageMetrics(language);
    }
    
    // 检查整体健康状况
    this.checkOverallHealth();
  }

  /**
   * 检查整体健康状况
   */
  checkOverallHealth() {
    const healthScore = this.calculateOverallHealth();
    
    if (healthScore < 0.8) {
      this.sendAlert('warning', '整体翻译健康度较低', {
        healthScore: (healthScore * 100).toFixed(1) + '%'
      });
    }
  }

  /**
   * 计算整体健康度
   */
  calculateOverallHealth() {
    const languages = this.config.languages;
    let totalScore = 0;
    let validLanguages = 0;

    for (const language of languages) {
      const completeness = this.metrics.translationCompleteness[language];
      const quality = this.metrics.qualityScores[language];
      
      if (completeness !== undefined && quality !== undefined) {
        totalScore += (completeness + quality) / 2;
        validLanguages++;
      }
    }

    return validLanguages > 0 ? totalScore / validLanguages : 0;
  }

  /**
   * 生成小时报告
   */
  generateHourlyReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      alerts: this.alerts.filter(alert => 
        Date.now() - new Date(alert.timestamp).getTime() < 3600000 // 最近1小时
      ),
      healthScore: this.calculateOverallHealth()
    };

    // 保存报告
    const reportPath = path.join(__dirname, '../../monitoring-reports', 
      `hourly-${new Date().toISOString().slice(0, 13)}.json`);
    
    this.ensureDirectoryExists(path.dirname(reportPath));
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 小时报告已生成: ${reportPath}`);
  }

  /**
   * 显示当前状态
   */
  displayCurrentStatus() {
    console.log('\n📊 当前翻译状态:');
    console.log('─'.repeat(50));
    
    for (const language of this.config.languages) {
      const completeness = this.metrics.translationCompleteness[language] || 0;
      const quality = this.metrics.qualityScores[language] || 0;
      const status = completeness > 0.9 && quality > 0.8 ? '✅' : '⚠️';
      
      console.log(`${status} ${language}: 完整性 ${(completeness * 100).toFixed(1)}%, 质量 ${(quality * 100).toFixed(1)}%`);
    }
    
    const healthScore = this.calculateOverallHealth();
    console.log(`\n🏥 整体健康度: ${(healthScore * 100).toFixed(1)}%`);
    console.log('─'.repeat(50));
  }

  /**
   * 启动Web监控面板
   */
  startWebMonitor() {
    const express = require('express'); // 需要安装: npm install express
    const app = express();
    const port = process.env.MONITOR_PORT || 3001;

    app.get('/status', (req, res) => {
      res.json({
        metrics: this.metrics,
        alerts: this.alerts.slice(-10), // 最近10个告警
        healthScore: this.calculateOverallHealth(),
        timestamp: new Date().toISOString()
      });
    });

    app.get('/health', (req, res) => {
      const healthScore = this.calculateOverallHealth();
      res.json({
        status: healthScore > 0.8 ? 'healthy' : 'warning',
        score: healthScore,
        timestamp: new Date().toISOString()
      });
    });

    app.listen(port, () => {
      console.log(`🌐 Web监控面板启动: http://localhost:${port}`);
    });
  }

  /**
   * 工具函数
   */
  extractLanguageFromPath(filePath) {
    const match = filePath.match(/([a-z]{2}-[A-Z]{2})\.json$/);
    return match ? match[1] : null;
  }

  findTranslationFiles(language) {
    const files = [];
    const searchDirs = [
      path.join(this.i18nDir, 'core'),
      path.join(this.i18nDir, 'pages'),
      path.join(this.i18nDir, 'features'),
      this.i18nDir
    ];

    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        const filePath = path.join(dir, `${language}.json`);
        if (fs.existsSync(filePath)) {
          files.push(filePath);
        }

        // 检查子目录
        try {
          const subDirs = fs.readdirSync(dir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

          for (const subDir of subDirs) {
            const subFilePath = path.join(dir, subDir, `${language}.json`);
            if (fs.existsSync(subFilePath)) {
              files.push(subFilePath);
            }
          }
        } catch (error) {
          // 跳过无法访问的目录
        }
      }
    }

    return files;
  }

  flattenObject(obj, prefix = '') {
    const flattened = {};
    for (const key in obj) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, this.flattenObject(obj[key], newKey));
      } else {
        flattened[newKey] = obj[key];
      }
    }
    return flattened;
  }

  recordChange(language, type, data) {
    // 记录变化历史
    const change = {
      timestamp: new Date().toISOString(),
      language,
      type,
      data
    };
    
    this.monitoringData.changes = this.monitoringData.changes || [];
    this.monitoringData.changes.push(change);
    
    // 保持最近1000条记录
    if (this.monitoringData.changes.length > 1000) {
      this.monitoringData.changes = this.monitoringData.changes.slice(-1000);
    }
    
    this.saveMonitoringData();
  }

  recordError(language, error) {
    this.metrics.errorCounts[language] = (this.metrics.errorCounts[language] || 0) + 1;
    this.sendAlert('error', `翻译处理错误: ${error.message}`, { language });
  }

  getLastAlert(language) {
    return this.alerts
      .filter(alert => alert.data.language === language)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  }

  saveAlert(alert) {
    // 保存到文件或数据库
    const alertsPath = path.join(__dirname, '../../.translation-alerts.json');
    const alerts = this.loadAlertsHistory();
    alerts.push(alert);
    
    // 保持最近100条告警
    if (alerts.length > 100) {
      alerts.splice(0, alerts.length - 100);
    }
    
    fs.writeFileSync(alertsPath, JSON.stringify(alerts, null, 2));
  }

  loadAlertsHistory() {
    const alertsPath = path.join(__dirname, '../../.translation-alerts.json');
    try {
      return JSON.parse(fs.readFileSync(alertsPath, 'utf8'));
    } catch {
      return [];
    }
  }

  loadMonitoringData() {
    const dataPath = path.join(__dirname, '../../.translation-monitoring.json');
    try {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch {
      return { changes: [] };
    }
  }

  saveMonitoringData() {
    const dataPath = path.join(__dirname, '../../.translation-monitoring.json');
    fs.writeFileSync(dataPath, JSON.stringify(this.monitoringData, null, 2));
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  handleWatchError(error) {
    console.error('文件监控错误:', error);
    this.sendAlert('error', '文件监控系统错误', { error: error.message });
  }

  stopMonitoring() {
    // 停止所有监控
    this.watchers.forEach(watcher => watcher.close());
    this.watchers.clear();
    
    // 生成最终报告
    this.generateFinalReport();
    
    console.log('✅ 监控系统已停止');
  }

  generateFinalReport() {
    const report = {
      timestamp: new Date().toISOString(),
      finalMetrics: this.metrics,
      totalAlerts: this.alerts.length,
      healthScore: this.calculateOverallHealth(),
      uptime: process.uptime()
    };

    const reportPath = path.join(__dirname, '../../TRANSLATION_MONITORING_FINAL_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 最终监控报告: ${reportPath}`);
  }
}

// 命令行接口
if (require.main === module) {
  const monitor = new TranslationMonitor();
  monitor.startMonitoring();
}

module.exports = TranslationMonitor;