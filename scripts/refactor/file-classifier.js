#!/usr/bin/env node

/**
 * 智能文件分类器
 * 用于自动分析和分类项目中的所有文件
 * 支持按功能、类型、重要性等维度进行分类
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FileClassifier {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.results = {
            documents: [],
            scripts: [],
            configs: [],
            duplicates: [],
            outdated: [],
            important: [],
            temporary: []
        };
        
        // 文件类型定义
        this.fileTypes = {
            documents: ['.md', '.txt', '.rst', '.adoc'],
            scripts: ['.js', '.ts', '.sh', '.py', '.rb'],
            configs: ['.json', '.yaml', '.yml', '.toml', '.ini', '.env'],
            images: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'],
            styles: ['.css', '.scss', '.sass', '.less'],
            data: ['.sql', '.db', '.sqlite']
        };
        
        // 重要性关键词
        this.importanceKeywords = {
            high: ['readme', 'license', 'changelog', 'package', 'config', 'setup', 'install'],
            medium: ['guide', 'tutorial', 'example', 'demo', 'test'],
            low: ['temp', 'tmp', 'backup', 'old', 'deprecated', 'legacy']
        };
        
        // 过时文件标识
        this.outdatedPatterns = [
            /backup/i,
            /old/i,
            /deprecated/i,
            /legacy/i,
            /temp/i,
            /tmp/i,
            /\d{4}-\d{2}-\d{2}/,  // 日期格式
            /\d{8}/,              // 8位数字日期
            /\.bak$/,
            /\.old$/,
            /~$/
        ];
        
        // 临时文件模式
        this.temporaryPatterns = [
            /\.DS_Store$/,
            /\.log$/,
            /\.cache$/,
            /\.tmp$/,
            /\.temp$/,
            /node_modules/,
            /\.next/,
            /\.git/,
            /\.vscode/,
            /\.idea/,
            /dist/,
            /build/,
            /coverage/
        ];
    }
    
    /**
     * 执行文件分类
     */
    async classify() {
        console.log('🔍 开始文件分类分析...');
        
        await this.scanDirectory(this.projectRoot);
        await this.detectDuplicates();
        await this.analyzeContent();
        
        return this.generateReport();
    }
    
    /**
     * 扫描目录
     */
    async scanDirectory(dir, relativePath = '') {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const relPath = path.join(relativePath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // 跳过某些目录
                if (this.shouldSkipDirectory(item)) {
                    continue;
                }
                await this.scanDirectory(fullPath, relPath);
            } else {
                await this.classifyFile(fullPath, relPath, stat);
            }
        }
    }
    
    /**
     * 判断是否跳过目录
     */
    shouldSkipDirectory(dirname) {
        const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage'];
        return skipDirs.includes(dirname);
    }
    
    /**
     * 分类单个文件
     */
    async classifyFile(fullPath, relativePath, stat) {
        const ext = path.extname(relativePath).toLowerCase();
        const basename = path.basename(relativePath, ext).toLowerCase();
        const dirname = path.dirname(relativePath);
        
        const fileInfo = {
            path: relativePath,
            fullPath: fullPath,
            name: path.basename(relativePath),
            basename: basename,
            extension: ext,
            directory: dirname,
            size: stat.size,
            modified: stat.mtime,
            created: stat.birthtime,
            type: this.getFileType(ext),
            importance: this.getImportanceLevel(basename, relativePath),
            isOutdated: this.isOutdated(relativePath, basename),
            isTemporary: this.isTemporary(relativePath),
            hash: await this.getFileHash(fullPath)
        };
        
        // 按类型分类
        if (fileInfo.type && this.results[fileInfo.type]) {
            this.results[fileInfo.type].push(fileInfo);
        } else if (fileInfo.type === 'other') {
            // 为其他类型文件创建数组
            if (!this.results.other) {
                this.results.other = [];
            }
            this.results.other.push(fileInfo);
        }
        
        // 按重要性分类
        if (fileInfo.importance === 'high') {
            this.results.important.push(fileInfo);
        }
        
        // 标记过时文件
        if (fileInfo.isOutdated) {
            this.results.outdated.push(fileInfo);
        }
        
        // 标记临时文件
        if (fileInfo.isTemporary) {
            this.results.temporary.push(fileInfo);
        }
    }
    
    /**
     * 获取文件类型
     */
    getFileType(extension) {
        for (const [type, extensions] of Object.entries(this.fileTypes)) {
            if (extensions.includes(extension)) {
                return type;
            }
        }
        return 'other';
    }
    
    /**
     * 获取重要性级别
     */
    getImportanceLevel(basename, fullPath) {
        const lowerPath = fullPath.toLowerCase();
        
        for (const [level, keywords] of Object.entries(this.importanceKeywords)) {
            for (const keyword of keywords) {
                if (basename.includes(keyword) || lowerPath.includes(keyword)) {
                    return level;
                }
            }
        }
        
        return 'medium';
    }
    
    /**
     * 判断是否为过时文件
     */
    isOutdated(filePath, basename) {
        return this.outdatedPatterns.some(pattern => 
            pattern.test(filePath) || pattern.test(basename)
        );
    }
    
    /**
     * 判断是否为临时文件
     */
    isTemporary(filePath) {
        return this.temporaryPatterns.some(pattern => pattern.test(filePath));
    }
    
    /**
     * 获取文件哈希值
     */
    async getFileHash(filePath) {
        try {
            const content = fs.readFileSync(filePath);
            return crypto.createHash('md5').update(content).digest('hex');
        } catch (error) {
            return null;
        }
    }
    
    /**
     * 检测重复文件
     */
    async detectDuplicates() {
        console.log('🔍 检测重复文件...');
        
        const hashMap = new Map();
        const allFiles = [
            ...this.results.documents,
            ...this.results.scripts,
            ...this.results.configs
        ];
        
        for (const file of allFiles) {
            if (file.hash) {
                if (hashMap.has(file.hash)) {
                    const existing = hashMap.get(file.hash);
                    
                    // 检查是否已经在重复列表中
                    let duplicateGroup = this.results.duplicates.find(group => 
                        group.hash === file.hash
                    );
                    
                    if (!duplicateGroup) {
                        duplicateGroup = {
                            hash: file.hash,
                            files: [existing],
                            size: existing.size
                        };
                        this.results.duplicates.push(duplicateGroup);
                    }
                    
                    duplicateGroup.files.push(file);
                } else {
                    hashMap.set(file.hash, file);
                }
            }
        }
    }
    
    /**
     * 分析文件内容
     */
    async analyzeContent() {
        console.log('📖 分析文档内容...');
        
        for (const doc of this.results.documents) {
            try {
                const content = fs.readFileSync(doc.fullPath, 'utf8');
                doc.contentAnalysis = {
                    lineCount: content.split('\n').length,
                    wordCount: content.split(/\s+/).length,
                    hasHeaders: /^#+\s/m.test(content),
                    hasCodeBlocks: /```/.test(content),
                    hasLinks: /\[.*\]\(.*\)/.test(content),
                    isEmpty: content.trim().length === 0,
                    language: this.detectLanguage(content),
                    topics: this.extractTopics(content)
                };
            } catch (error) {
                doc.contentAnalysis = { error: error.message };
            }
        }
    }
    
    /**
     * 检测文档语言
     */
    detectLanguage(content) {
        const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
        const totalChars = content.length;
        
        if (chineseChars / totalChars > 0.3) {
            return 'zh';
        }
        return 'en';
    }
    
    /**
     * 提取主题关键词
     */
    extractTopics(content) {
        const topics = [];
        const lines = content.split('\n');
        
        // 提取标题作为主题
        for (const line of lines) {
            const headerMatch = line.match(/^#+\s+(.+)$/);
            if (headerMatch) {
                topics.push(headerMatch[1].trim());
            }
        }
        
        return topics.slice(0, 10); // 限制数量
    }
    
    /**
     * 生成分类报告
     */
    generateReport() {
        const report = {
            summary: {
                totalFiles: this.getTotalFileCount(),
                documents: this.results.documents.length,
                scripts: this.results.scripts.length,
                configs: this.results.configs.length,
                duplicates: this.results.duplicates.length,
                outdated: this.results.outdated.length,
                temporary: this.results.temporary.length,
                important: this.results.important.length
            },
            details: this.results,
            recommendations: this.generateRecommendations()
        };
        
        return report;
    }
    
    /**
     * 获取总文件数
     */
    getTotalFileCount() {
        return Object.values(this.results)
            .filter(Array.isArray)
            .reduce((total, arr) => total + arr.length, 0);
    }
    
    /**
     * 生成建议
     */
    generateRecommendations() {
        const recommendations = [];
        
        // 重复文件建议
        if (this.results.duplicates.length > 0) {
            recommendations.push({
                type: 'duplicates',
                priority: 'high',
                message: `发现 ${this.results.duplicates.length} 组重复文件，建议合并或删除`,
                action: 'review_duplicates'
            });
        }
        
        // 过时文件建议
        if (this.results.outdated.length > 0) {
            recommendations.push({
                type: 'outdated',
                priority: 'medium',
                message: `发现 ${this.results.outdated.length} 个可能过时的文件，建议归档或删除`,
                action: 'archive_outdated'
            });
        }
        
        // 临时文件建议
        if (this.results.temporary.length > 0) {
            recommendations.push({
                type: 'temporary',
                priority: 'low',
                message: `发现 ${this.results.temporary.length} 个临时文件，建议清理`,
                action: 'clean_temporary'
            });
        }
        
        // 文档组织建议
        const docsInRoot = this.results.documents.filter(doc => 
            !doc.directory.includes('docs')
        );
        
        if (docsInRoot.length > 0) {
            recommendations.push({
                type: 'organization',
                priority: 'medium',
                message: `发现 ${docsInRoot.length} 个文档文件不在docs目录中，建议重新组织`,
                action: 'organize_docs'
            });
        }
        
        return recommendations;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const projectRoot = process.argv[2] || process.cwd();
    const classifier = new FileClassifier(projectRoot);
    
    classifier.classify().then(report => {
        console.log('\n📊 文件分类报告:');
        console.log('================');
        console.log(`总文件数: ${report.summary.totalFiles}`);
        console.log(`文档文件: ${report.summary.documents}`);
        console.log(`脚本文件: ${report.summary.scripts}`);
        console.log(`配置文件: ${report.summary.configs}`);
        console.log(`重复文件组: ${report.summary.duplicates}`);
        console.log(`过时文件: ${report.summary.outdated}`);
        console.log(`临时文件: ${report.summary.temporary}`);
        console.log(`重要文件: ${report.summary.important}`);
        
        console.log('\n💡 建议:');
        report.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
        });
        
        // 保存详细报告
        const reportPath = path.join(projectRoot, 'docs', 'file-classification-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 详细报告已保存到: ${reportPath}`);
        
    }).catch(error => {
        console.error('❌ 分类过程中出现错误:', error);
        process.exit(1);
    });
}

module.exports = FileClassifier;