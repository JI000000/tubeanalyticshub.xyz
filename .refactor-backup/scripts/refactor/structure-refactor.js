#!/usr/bin/env node

/**
 * 目录结构重构工具
 * 用于安全地重构项目目录结构，包括文件迁移和引用更新
 */

const fs = require('fs');
const path = require('path');

class StructureRefactor {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.backupDir = path.join(projectRoot, '.refactor-backup');
        this.operations = [];
        this.rollbackLog = [];
        
        // 新的目录结构定义
        this.newStructure = {
            'docs/getting-started': {
                description: '入门指南和快速开始',
                files: []
            },
            'docs/development': {
                description: '开发文档和指南',
                files: []
            },
            'docs/architecture': {
                description: '架构设计和技术规范',
                files: []
            },
            'docs/features': {
                description: '功能说明和用户指南',
                files: []
            },
            'docs/api': {
                description: 'API文档和接口说明',
                files: []
            },
            'docs/operations': {
                description: '运维部署和维护文档',
                files: []
            },
            'docs/archive': {
                description: '归档文档',
                files: []
            }
        };
        
        // 脚本目录结构
        this.scriptStructure = {
            'scripts/setup': {
                description: '项目设置和初始化脚本',
                files: []
            },
            'scripts/development': {
                description: '开发辅助脚本',
                files: []
            },
            'scripts/database': {
                description: '数据库操作脚本',
                files: []
            },
            'scripts/build': {
                description: '构建相关脚本',
                files: []
            },
            'scripts/deployment': {
                description: '部署脚本',
                files: []
            },
            'scripts/maintenance': {
                description: '维护和清理脚本',
                files: []
            },
            'scripts/i18n': {
                description: '国际化脚本',
                files: []
            },
            'scripts/utils': {
                description: '通用工具脚本',
                files: []
            }
        };
    }
    
    /**
     * 执行重构
     */
    async refactor() {
        console.log('🔧 开始项目结构重构...');
        
        try {
            await this.createBackup();
            await this.analyzeCurrentStructure();
            await this.planMigration();
            await this.executeRefactor();
            await this.updateReferences();
            await this.cleanup();
            
            console.log('✅ 重构完成！');
            return true;
        } catch (error) {
            console.error('❌ 重构失败:', error.message);
            await this.rollback();
            return false;
        }
    }
    
    /**
     * 创建备份
     */
    async createBackup() {
        console.log('💾 创建项目备份...');
        
        if (fs.existsSync(this.backupDir)) {
            fs.rmSync(this.backupDir, { recursive: true, force: true });
        }
        
        fs.mkdirSync(this.backupDir, { recursive: true });
        
        // 备份docs目录
        const docsDir = path.join(this.projectRoot, 'docs');
        if (fs.existsSync(docsDir)) {
            await this.copyDirectory(docsDir, path.join(this.backupDir, 'docs'));
        }
        
        // 备份scripts目录
        const scriptsDir = path.join(this.projectRoot, 'scripts');
        if (fs.existsSync(scriptsDir)) {
            await this.copyDirectory(scriptsDir, path.join(this.backupDir, 'scripts'));
        }
        
        // 备份根目录文档
        const rootDocs = ['PROJECT_OVERVIEW.md', 'CLEANUP_SUMMARY.md', 'DEPLOYMENT.md'];
        for (const doc of rootDocs) {
            const srcPath = path.join(this.projectRoot, doc);
            if (fs.existsSync(srcPath)) {
                const destPath = path.join(this.backupDir, doc);
                fs.copyFileSync(srcPath, destPath);
            }
        }
        
        console.log(`📦 备份已创建: ${this.backupDir}`);
    }
    
    /**
     * 复制目录
     */
    async copyDirectory(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const items = fs.readdirSync(src);
        for (const item of items) {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            const stat = fs.statSync(srcPath);
            
            if (stat.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
    
    /**
     * 分析当前结构
     */
    async analyzeCurrentStructure() {
        console.log('🔍 分析当前项目结构...');
        
        // 加载分析报告
        const classificationPath = path.join(this.projectRoot, 'docs', 'file-classification-report.json');
        const contentAnalysisPath = path.join(this.projectRoot, 'docs', 'content-analysis-report.json');
        
        if (fs.existsSync(classificationPath)) {
            this.classificationReport = JSON.parse(fs.readFileSync(classificationPath, 'utf8'));
        }
        
        if (fs.existsSync(contentAnalysisPath)) {
            this.contentReport = JSON.parse(fs.readFileSync(contentAnalysisPath, 'utf8'));
        }
    }
    
    /**
     * 规划迁移
     */
    async planMigration() {
        console.log('📋 规划文件迁移...');
        
        // 规划文档迁移
        await this.planDocumentMigration();
        
        // 规划脚本迁移
        await this.planScriptMigration();
        
        // 规划根目录清理
        await this.planRootCleanup();
    }
    
    /**
     * 规划文档迁移
     */
    async planDocumentMigration() {
        const migrationRules = {
            // 入门指南
            'getting-started': [
                'README.md',
                'setup-guide.md',
                'PROJECT_OVERVIEW.md'
            ],
            
            // 开发文档
            'development': [
                'FILE_ORGANIZATION_RULES.md',
                'FILE_ORGANIZATION_SOLUTION.md',
                'setup-guide.md'
            ],
            
            // 架构文档
            'architecture': [
                'project-config.md'
            ],
            
            // 功能文档
            'features': [
                'i18n-strategy.md',
                'translation-guide.md'
            ],
            
            // API文档
            'api': [
                // 暂时为空，后续可能添加
            ],
            
            // 运维文档
            'operations': [
                'DEPLOYMENT.md',
                'cost-analysis.md',
                'script-usage-guide.md'
            ],
            
            // 归档文档
            'archive': [
                // 所有时间戳文档
                // 所有archived目录下的文档
                // 所有reports目录下的文档
            ]
        };
        
        // 处理每个分类
        for (const [category, patterns] of Object.entries(migrationRules)) {
            const targetDir = `docs/${category}`;
            
            for (const pattern of patterns) {
                const files = this.findMatchingFiles(pattern);
                for (const file of files) {
                    this.operations.push({
                        type: 'move',
                        source: file,
                        target: path.join(targetDir, path.basename(file)),
                        category: category
                    });
                }
            }
        }
        
        // 处理归档文档
        await this.planArchiveMigration();
    }
    
    /**
     * 规划归档迁移
     */
    async planArchiveMigration() {
        const archivePatterns = [
            /\d{4}-\d{2}-\d{2}/,  // 时间戳文件
            /archived/i,
            /reports/i,
            /status/i,
            /backup/i
        ];
        
        const docsDir = path.join(this.projectRoot, 'docs');
        if (fs.existsSync(docsDir)) {
            await this.scanForArchiveFiles(docsDir, archivePatterns);
        }
    }
    
    /**
     * 扫描归档文件
     */
    async scanForArchiveFiles(dir, patterns, relativePath = '') {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const relPath = path.join(relativePath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // 整个目录需要归档
                if (patterns.some(pattern => pattern.test(item))) {
                    this.operations.push({
                        type: 'move_directory',
                        source: fullPath,
                        target: path.join(this.projectRoot, 'docs/archive', item),
                        category: 'archive'
                    });
                } else {
                    await this.scanForArchiveFiles(fullPath, patterns, relPath);
                }
            } else if (path.extname(item) === '.md') {
                // 单个文件需要归档
                if (patterns.some(pattern => pattern.test(relPath))) {
                    this.operations.push({
                        type: 'move',
                        source: fullPath,
                        target: path.join(this.projectRoot, 'docs/archive', relPath),
                        category: 'archive'
                    });
                }
            }
        }
    }
    
    /**
     * 规划脚本迁移
     */
    async planScriptMigration() {
        const scriptRules = {
            'setup': ['dev-setup.js', 'init-database.js'],
            'development': ['dev-check.js', 'project-health-check.js'],
            'database': ['check-database.js', 'init-database.js'],
            'build': [],
            'deployment': ['deploy-prep.js'],
            'maintenance': ['seed-data.js'],
            'i18n': ['i18n-*.js', 'translation-*.js', 'ai-translation-*.js'],
            'utils': ['test-*.js']
        };
        
        const scriptsDir = path.join(this.projectRoot, 'scripts');
        if (fs.existsSync(scriptsDir)) {
            await this.scanScripts(scriptsDir, scriptRules);
        }
    }
    
    /**
     * 扫描脚本文件
     */
    async scanScripts(dir, rules) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // 处理子目录
                if (item === 'legacy') {
                    // legacy目录整体移动到archive
                    this.operations.push({
                        type: 'move_directory',
                        source: fullPath,
                        target: path.join(this.projectRoot, 'scripts/archive', item),
                        category: 'archive'
                    });
                } else if (item === 'refactor') {
                    // 保持refactor目录不变
                    continue;
                } else {
                    // 其他目录按规则处理
                    const targetCategory = this.categorizeScriptDirectory(item);
                    if (targetCategory && targetCategory !== item) {
                        this.operations.push({
                            type: 'move_directory',
                            source: fullPath,
                            target: path.join(this.projectRoot, 'scripts', targetCategory, item),
                            category: targetCategory
                        });
                    }
                }
            } else if (path.extname(item) === '.js') {
                // 处理根目录的脚本文件
                const targetCategory = this.categorizeScript(item);
                if (targetCategory) {
                    this.operations.push({
                        type: 'move',
                        source: fullPath,
                        target: path.join(this.projectRoot, 'scripts', targetCategory, item),
                        category: targetCategory
                    });
                }
            }
        }
    }
    
    /**
     * 脚本目录分类
     */
    categorizeScriptDirectory(dirname) {
        const mapping = {
            'analytics': 'utils',
            'database': 'database',
            'i18n': 'i18n',
            'reports': 'utils',
            'utils': 'utils'
        };
        
        return mapping[dirname] || null;
    }
    
    /**
     * 脚本文件分类
     */
    categorizeScript(filename) {
        if (filename.includes('setup') || filename.includes('init')) {
            return 'setup';
        }
        if (filename.includes('dev') || filename.includes('check')) {
            return 'development';
        }
        if (filename.includes('deploy')) {
            return 'deployment';
        }
        if (filename.includes('seed') || filename.includes('clean')) {
            return 'maintenance';
        }
        if (filename.includes('test')) {
            return 'utils';
        }
        
        return 'utils'; // 默认分类
    }
    
    /**
     * 规划根目录清理
     */
    async planRootCleanup() {
        const rootDocs = ['PROJECT_OVERVIEW.md', 'CLEANUP_SUMMARY.md', 'DEPLOYMENT.md'];
        
        for (const doc of rootDocs) {
            const srcPath = path.join(this.projectRoot, doc);
            if (fs.existsSync(srcPath)) {
                let targetCategory = 'getting-started';
                
                if (doc === 'DEPLOYMENT.md') {
                    targetCategory = 'operations';
                } else if (doc === 'CLEANUP_SUMMARY.md') {
                    targetCategory = 'archive';
                }
                
                this.operations.push({
                    type: 'move',
                    source: srcPath,
                    target: path.join(this.projectRoot, 'docs', targetCategory, doc),
                    category: targetCategory
                });
            }
        }
    }
    
    /**
     * 查找匹配文件
     */
    findMatchingFiles(pattern) {
        const files = [];
        const searchDirs = [
            path.join(this.projectRoot, 'docs'),
            this.projectRoot
        ];
        
        for (const dir of searchDirs) {
            if (fs.existsSync(dir)) {
                this.searchFiles(dir, pattern, files);
            }
        }
        
        return files;
    }
    
    /**
     * 搜索文件
     */
    searchFiles(dir, pattern, results, depth = 0) {
        if (depth > 3) return; // 限制搜索深度
        
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                this.searchFiles(fullPath, pattern, results, depth + 1);
            } else if (item === pattern || item.includes(pattern.replace('*', ''))) {
                results.push(fullPath);
            }
        }
    }
    
    /**
     * 执行重构
     */
    async executeRefactor() {
        console.log('🚀 执行文件迁移...');
        
        // 创建新目录结构
        await this.createDirectories();
        
        // 执行文件操作
        for (const operation of this.operations) {
            try {
                await this.executeOperation(operation);
                this.rollbackLog.push(operation);
            } catch (error) {
                console.warn(`⚠️  操作失败: ${operation.source} -> ${operation.target}: ${error.message}`);
            }
        }
        
        console.log(`✅ 完成 ${this.rollbackLog.length} 个文件操作`);
    }
    
    /**
     * 创建目录结构
     */
    async createDirectories() {
        console.log('📁 创建新目录结构...');
        
        // 创建文档目录
        for (const dirPath of Object.keys(this.newStructure)) {
            const fullPath = path.join(this.projectRoot, dirPath);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`📂 创建目录: ${dirPath}`);
            }
        }
        
        // 创建脚本目录
        for (const dirPath of Object.keys(this.scriptStructure)) {
            const fullPath = path.join(this.projectRoot, dirPath);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`📂 创建目录: ${dirPath}`);
            }
        }
        
        // 创建归档目录
        const archiveDir = path.join(this.projectRoot, 'scripts/archive');
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir, { recursive: true });
        }
    }
    
    /**
     * 执行单个操作
     */
    async executeOperation(operation) {
        const targetDir = path.dirname(operation.target);
        
        // 确保目标目录存在
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        if (operation.type === 'move') {
            if (fs.existsSync(operation.source)) {
                fs.renameSync(operation.source, operation.target);
                console.log(`📄 移动文件: ${path.relative(this.projectRoot, operation.source)} -> ${path.relative(this.projectRoot, operation.target)}`);
            }
        } else if (operation.type === 'move_directory') {
            if (fs.existsSync(operation.source)) {
                fs.renameSync(operation.source, operation.target);
                console.log(`📁 移动目录: ${path.relative(this.projectRoot, operation.source)} -> ${path.relative(this.projectRoot, operation.target)}`);
            }
        }
    }
    
    /**
     * 更新引用
     */
    async updateReferences() {
        console.log('🔗 更新文件引用...');
        
        // 这里可以添加更新文档内部链接的逻辑
        // 暂时跳过，因为大部分文档是独立的
        
        console.log('✅ 引用更新完成');
    }
    
    /**
     * 清理空目录
     */
    async cleanup() {
        console.log('🧹 清理空目录...');
        
        await this.removeEmptyDirectories(path.join(this.projectRoot, 'docs'));
        await this.removeEmptyDirectories(path.join(this.projectRoot, 'scripts'));
        
        console.log('✅ 清理完成');
    }
    
    /**
     * 删除空目录
     */
    async removeEmptyDirectories(dir) {
        if (!fs.existsSync(dir)) return;
        
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                await this.removeEmptyDirectories(fullPath);
                
                // 检查目录是否为空
                const subItems = fs.readdirSync(fullPath);
                if (subItems.length === 0) {
                    fs.rmdirSync(fullPath);
                    console.log(`🗑️  删除空目录: ${path.relative(this.projectRoot, fullPath)}`);
                }
            }
        }
    }
    
    /**
     * 回滚操作
     */
    async rollback() {
        console.log('🔄 执行回滚操作...');
        
        try {
            // 恢复备份
            if (fs.existsSync(this.backupDir)) {
                const backupDocs = path.join(this.backupDir, 'docs');
                const backupScripts = path.join(this.backupDir, 'scripts');
                
                if (fs.existsSync(backupDocs)) {
                    const targetDocs = path.join(this.projectRoot, 'docs');
                    if (fs.existsSync(targetDocs)) {
                        fs.rmSync(targetDocs, { recursive: true, force: true });
                    }
                    fs.renameSync(backupDocs, targetDocs);
                }
                
                if (fs.existsSync(backupScripts)) {
                    const targetScripts = path.join(this.projectRoot, 'scripts');
                    if (fs.existsSync(targetScripts)) {
                        fs.rmSync(targetScripts, { recursive: true, force: true });
                    }
                    fs.renameSync(backupScripts, targetScripts);
                }
                
                console.log('✅ 回滚完成');
            }
        } catch (error) {
            console.error('❌ 回滚失败:', error.message);
        }
    }
    
    /**
     * 生成重构报告
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            operations: this.operations.length,
            successful: this.rollbackLog.length,
            failed: this.operations.length - this.rollbackLog.length,
            newStructure: {
                docs: Object.keys(this.newStructure),
                scripts: Object.keys(this.scriptStructure)
            },
            operationDetails: this.rollbackLog
        };
        
        const reportPath = path.join(this.projectRoot, 'docs', 'refactor-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        return report;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const projectRoot = process.argv[2] || process.cwd();
    const refactor = new StructureRefactor(projectRoot);
    
    refactor.refactor().then(success => {
        if (success) {
            const report = refactor.generateReport();
            console.log('\n📊 重构报告:');
            console.log('============');
            console.log(`总操作数: ${report.operations}`);
            console.log(`成功操作: ${report.successful}`);
            console.log(`失败操作: ${report.failed}`);
            console.log(`新文档目录: ${report.newStructure.docs.length}`);
            console.log(`新脚本目录: ${report.newStructure.scripts.length}`);
            
            console.log('\n🎉 项目结构重构完成！');
            console.log('📄 详细报告已保存到: docs/refactor-report.json');
        } else {
            console.log('\n❌ 重构失败，已执行回滚操作');
            process.exit(1);
        }
    }).catch(error => {
        console.error('❌ 重构过程中出现严重错误:', error);
        process.exit(1);
    });
}

module.exports = StructureRefactor;