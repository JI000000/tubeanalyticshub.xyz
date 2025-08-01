#!/usr/bin/env node

/**
 * 文档内容分析器
 * 用于检测重复内容、分析文档价值、识别可整合的内容
 */

const fs = require('fs');
const path = require('path');

class ContentAnalyzer {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.documents = [];
        this.contentSimilarity = [];
        this.valueAssessment = [];
        this.integrationSuggestions = [];
    }
    
    /**
     * 执行内容分析
     */
    async analyze() {
        console.log('📖 开始文档内容分析...');
        
        await this.loadDocuments();
        await this.analyzeSimilarity();
        await this.assessValue();
        await this.generateIntegrationSuggestions();
        
        return this.generateReport();
    }
    
    /**
     * 加载所有文档
     */
    async loadDocuments() {
        console.log('📚 加载文档文件...');
        
        const docsDir = path.join(this.projectRoot, 'docs');
        const rootDocs = ['CLEANUP_SUMMARY.md', 'DEPLOYMENT.md', 'PROJECT_OVERVIEW.md'];
        
        // 加载docs目录下的文档
        if (fs.existsSync(docsDir)) {
            await this.scanDocuments(docsDir);
        }
        
        // 加载根目录的文档
        for (const docName of rootDocs) {
            const docPath = path.join(this.projectRoot, docName);
            if (fs.existsSync(docPath)) {
                await this.loadDocument(docPath, docName);
            }
        }
        
        console.log(`📄 已加载 ${this.documents.length} 个文档`);
    }
    
    /**
     * 扫描文档目录
     */
    async scanDocuments(dir, relativePath = '') {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const relPath = path.join(relativePath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                await this.scanDocuments(fullPath, relPath);
            } else if (path.extname(item).toLowerCase() === '.md') {
                await this.loadDocument(fullPath, relPath);
            }
        }
    }
    
    /**
     * 加载单个文档
     */
    async loadDocument(fullPath, relativePath) {
        try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const stat = fs.statSync(fullPath);
            
            const doc = {
                path: relativePath,
                fullPath: fullPath,
                name: path.basename(relativePath),
                directory: path.dirname(relativePath),
                size: stat.size,
                modified: stat.mtime,
                content: content,
                analysis: this.analyzeContent(content),
                metadata: this.extractMetadata(content, relativePath)
            };
            
            this.documents.push(doc);
        } catch (error) {
            console.warn(`⚠️  无法加载文档 ${relativePath}: ${error.message}`);
        }
    }
    
    /**
     * 分析文档内容
     */
    analyzeContent(content) {
        const lines = content.split('\n');
        const words = content.split(/\s+/).filter(word => word.length > 0);
        
        return {
            lineCount: lines.length,
            wordCount: words.length,
            charCount: content.length,
            isEmpty: content.trim().length === 0,
            hasHeaders: /^#+\s/m.test(content),
            headerCount: (content.match(/^#+\s/gm) || []).length,
            hasCodeBlocks: /```/.test(content),
            codeBlockCount: (content.match(/```/g) || []).length / 2,
            hasLinks: /\[.*\]\(.*\)/.test(content),
            linkCount: (content.match(/\[.*\]\(.*\)/g) || []).length,
            hasTables: /\|.*\|/.test(content),
            tableCount: (content.match(/\|.*\|/g) || []).length,
            hasImages: /!\[.*\]\(.*\)/.test(content),
            imageCount: (content.match(/!\[.*\]\(.*\)/g) || []).length,
            language: this.detectLanguage(content),
            topics: this.extractTopics(content),
            keywords: this.extractKeywords(content)
        };
    }
    
    /**
     * 提取文档元数据
     */
    extractMetadata(content, filePath) {
        const metadata = {
            category: this.categorizeDocument(filePath, content),
            importance: this.assessImportance(filePath, content),
            isTimestamped: /\d{4}-\d{2}-\d{2}/.test(filePath),
            isReport: /report|summary|status/i.test(filePath),
            isGuide: /guide|tutorial|howto/i.test(filePath),
            isConfig: /config|setup|install/i.test(filePath),
            isArchived: /archived|old|backup/i.test(filePath)
        };
        
        return metadata;
    }
    
    /**
     * 文档分类
     */
    categorizeDocument(filePath, content) {
        const pathLower = filePath.toLowerCase();
        const contentLower = content.toLowerCase();
        
        if (pathLower.includes('overview') || contentLower.includes('项目概述')) {
            return 'overview';
        }
        if (pathLower.includes('setup') || pathLower.includes('install')) {
            return 'setup';
        }
        if (pathLower.includes('deploy')) {
            return 'deployment';
        }
        if (pathLower.includes('i18n') || pathLower.includes('translation')) {
            return 'i18n';
        }
        if (pathLower.includes('report') || pathLower.includes('status')) {
            return 'report';
        }
        if (pathLower.includes('development') || pathLower.includes('dev')) {
            return 'development';
        }
        if (pathLower.includes('api')) {
            return 'api';
        }
        
        return 'general';
    }
    
    /**
     * 评估重要性
     */
    assessImportance(filePath, content) {
        let score = 0;
        
        // 基于文件名
        if (/readme|overview|setup|install/i.test(filePath)) score += 3;
        if (/guide|tutorial/i.test(filePath)) score += 2;
        if (/report|status/i.test(filePath)) score += 1;
        if (/backup|old|temp/i.test(filePath)) score -= 2;
        
        // 基于内容
        if (content.length > 5000) score += 2;
        if (content.length > 10000) score += 1;
        if (content.length < 500) score -= 1;
        
        if (/^#\s+/m.test(content)) score += 1; // 有主标题
        if ((content.match(/^#+\s/gm) || []).length > 5) score += 1; // 结构化
        if (/```/.test(content)) score += 1; // 有代码示例
        
        if (score >= 4) return 'high';
        if (score >= 2) return 'medium';
        if (score >= 0) return 'low';
        return 'very-low';
    }
    
    /**
     * 检测语言
     */
    detectLanguage(content) {
        const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
        const totalChars = content.replace(/\s/g, '').length;
        
        if (totalChars === 0) return 'unknown';
        
        const chineseRatio = chineseChars / totalChars;
        if (chineseRatio > 0.3) return 'zh';
        if (chineseRatio > 0.1) return 'mixed';
        return 'en';
    }
    
    /**
     * 提取主题
     */
    extractTopics(content) {
        const topics = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            const headerMatch = line.match(/^(#+)\s+(.+)$/);
            if (headerMatch) {
                const level = headerMatch[1].length;
                const title = headerMatch[2].trim();
                topics.push({ level, title });
            }
        }
        
        return topics;
    }
    
    /**
     * 提取关键词
     */
    extractKeywords(content) {
        const keywords = new Set();
        
        // 提取代码块中的关键词
        const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
        for (const block of codeBlocks) {
            const words = block.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
            words.forEach(word => {
                if (word.length > 3) keywords.add(word.toLowerCase());
            });
        }
        
        // 提取标题中的关键词
        const headers = content.match(/^#+\s+(.+)$/gm) || [];
        for (const header of headers) {
            const words = header.match(/\b[a-zA-Z\u4e00-\u9fff]+\b/g) || [];
            words.forEach(word => {
                if (word.length > 2) keywords.add(word.toLowerCase());
            });
        }
        
        return Array.from(keywords).slice(0, 20);
    }
    
    /**
     * 分析内容相似性
     */
    async analyzeSimilarity() {
        console.log('🔍 分析内容相似性...');
        
        for (let i = 0; i < this.documents.length; i++) {
            for (let j = i + 1; j < this.documents.length; j++) {
                const doc1 = this.documents[i];
                const doc2 = this.documents[j];
                
                const similarity = this.calculateSimilarity(doc1, doc2);
                
                if (similarity.score > 0.3) { // 相似度阈值
                    this.contentSimilarity.push({
                        doc1: doc1.path,
                        doc2: doc2.path,
                        similarity: similarity
                    });
                }
            }
        }
        
        console.log(`🔗 发现 ${this.contentSimilarity.length} 对相似文档`);
    }
    
    /**
     * 计算文档相似性
     */
    calculateSimilarity(doc1, doc2) {
        const similarity = {
            score: 0,
            reasons: []
        };
        
        // 标题相似性
        const titleSim = this.calculateTitleSimilarity(doc1.analysis.topics, doc2.analysis.topics);
        if (titleSim > 0.5) {
            similarity.score += titleSim * 0.4;
            similarity.reasons.push(`标题相似度: ${(titleSim * 100).toFixed(1)}%`);
        }
        
        // 关键词相似性
        const keywordSim = this.calculateKeywordSimilarity(doc1.analysis.keywords, doc2.analysis.keywords);
        if (keywordSim > 0.3) {
            similarity.score += keywordSim * 0.3;
            similarity.reasons.push(`关键词相似度: ${(keywordSim * 100).toFixed(1)}%`);
        }
        
        // 内容长度相似性
        const lengthSim = this.calculateLengthSimilarity(doc1.analysis.wordCount, doc2.analysis.wordCount);
        if (lengthSim > 0.7) {
            similarity.score += lengthSim * 0.1;
            similarity.reasons.push(`长度相似度: ${(lengthSim * 100).toFixed(1)}%`);
        }
        
        // 分类相似性
        if (doc1.metadata.category === doc2.metadata.category) {
            similarity.score += 0.2;
            similarity.reasons.push(`同类文档: ${doc1.metadata.category}`);
        }
        
        return similarity;
    }
    
    /**
     * 计算标题相似性
     */
    calculateTitleSimilarity(topics1, topics2) {
        if (topics1.length === 0 || topics2.length === 0) return 0;
        
        let matches = 0;
        const total = Math.max(topics1.length, topics2.length);
        
        for (const topic1 of topics1) {
            for (const topic2 of topics2) {
                if (this.stringSimilarity(topic1.title, topic2.title) > 0.7) {
                    matches++;
                    break;
                }
            }
        }
        
        return matches / total;
    }
    
    /**
     * 计算关键词相似性
     */
    calculateKeywordSimilarity(keywords1, keywords2) {
        if (keywords1.length === 0 || keywords2.length === 0) return 0;
        
        const set1 = new Set(keywords1);
        const set2 = new Set(keywords2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }
    
    /**
     * 计算长度相似性
     */
    calculateLengthSimilarity(len1, len2) {
        const min = Math.min(len1, len2);
        const max = Math.max(len1, len2);
        return max === 0 ? 1 : min / max;
    }
    
    /**
     * 字符串相似性计算
     */
    stringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    
    /**
     * 计算编辑距离
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    /**
     * 评估文档价值
     */
    async assessValue() {
        console.log('💎 评估文档价值...');
        
        for (const doc of this.documents) {
            const assessment = {
                path: doc.path,
                value: this.calculateDocumentValue(doc),
                recommendations: this.generateDocumentRecommendations(doc)
            };
            
            this.valueAssessment.push(assessment);
        }
    }
    
    /**
     * 计算文档价值
     */
    calculateDocumentValue(doc) {
        let score = 0;
        const reasons = [];
        
        // 基础内容价值
        if (doc.analysis.wordCount > 1000) {
            score += 3;
            reasons.push('内容丰富');
        } else if (doc.analysis.wordCount > 500) {
            score += 2;
            reasons.push('内容适中');
        } else if (doc.analysis.wordCount < 100) {
            score -= 2;
            reasons.push('内容过少');
        }
        
        // 结构化程度
        if (doc.analysis.headerCount > 5) {
            score += 2;
            reasons.push('结构清晰');
        }
        
        // 实用性
        if (doc.analysis.hasCodeBlocks) {
            score += 2;
            reasons.push('包含代码示例');
        }
        
        if (doc.analysis.hasLinks) {
            score += 1;
            reasons.push('包含有用链接');
        }
        
        // 重要性
        if (doc.metadata.importance === 'high') {
            score += 3;
            reasons.push('高重要性文档');
        } else if (doc.metadata.importance === 'medium') {
            score += 1;
            reasons.push('中等重要性');
        }
        
        // 时效性
        if (doc.metadata.isTimestamped) {
            const daysSinceModified = (Date.now() - doc.modified.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceModified > 30) {
                score -= 2;
                reasons.push('可能过时');
            }
        }
        
        // 归档状态
        if (doc.metadata.isArchived) {
            score -= 3;
            reasons.push('已归档');
        }
        
        return {
            score: Math.max(0, score),
            level: score >= 6 ? 'high' : score >= 3 ? 'medium' : score >= 1 ? 'low' : 'very-low',
            reasons: reasons
        };
    }
    
    /**
     * 生成文档建议
     */
    generateDocumentRecommendations(doc) {
        const recommendations = [];
        
        if (doc.analysis.isEmpty) {
            recommendations.push({ type: 'delete', reason: '空文档，建议删除' });
        } else if (doc.analysis.wordCount < 50) {
            recommendations.push({ type: 'merge', reason: '内容过少，建议合并到其他文档' });
        }
        
        if (doc.metadata.isTimestamped) {
            recommendations.push({ type: 'review', reason: '时间戳文档，需要审查时效性' });
        }
        
        if (doc.metadata.isArchived) {
            recommendations.push({ type: 'archive', reason: '建议移动到归档目录' });
        }
        
        if (!doc.analysis.hasHeaders && doc.analysis.wordCount > 200) {
            recommendations.push({ type: 'restructure', reason: '缺少标题结构，建议重新组织' });
        }
        
        return recommendations;
    }
    
    /**
     * 生成整合建议
     */
    async generateIntegrationSuggestions() {
        console.log('🔗 生成整合建议...');
        
        // 按分类分组
        const categories = {};
        for (const doc of this.documents) {
            const category = doc.metadata.category;
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(doc);
        }
        
        // 为每个分类生成建议
        for (const [category, docs] of Object.entries(categories)) {
            if (docs.length > 1) {
                this.integrationSuggestions.push({
                    type: 'category_merge',
                    category: category,
                    documents: docs.map(d => d.path),
                    reason: `${category}类别有${docs.length}个文档，建议整合`,
                    priority: docs.length > 3 ? 'high' : 'medium'
                });
            }
        }
        
        // 基于相似性的建议
        for (const sim of this.contentSimilarity) {
            if (sim.similarity.score > 0.7) {
                this.integrationSuggestions.push({
                    type: 'similarity_merge',
                    documents: [sim.doc1, sim.doc2],
                    similarity: sim.similarity.score,
                    reason: `内容高度相似 (${(sim.similarity.score * 100).toFixed(1)}%)，建议合并`,
                    priority: 'high'
                });
            }
        }
    }
    
    /**
     * 生成分析报告
     */
    generateReport() {
        const report = {
            summary: {
                totalDocuments: this.documents.length,
                similarPairs: this.contentSimilarity.length,
                integrationSuggestions: this.integrationSuggestions.length,
                highValueDocs: this.valueAssessment.filter(v => v.value.level === 'high').length,
                lowValueDocs: this.valueAssessment.filter(v => v.value.level === 'very-low').length
            },
            documents: this.documents.map(doc => ({
                path: doc.path,
                category: doc.metadata.category,
                importance: doc.metadata.importance,
                wordCount: doc.analysis.wordCount,
                language: doc.analysis.language,
                modified: doc.modified
            })),
            similarity: this.contentSimilarity,
            valueAssessment: this.valueAssessment,
            integrationSuggestions: this.integrationSuggestions,
            recommendations: this.generateOverallRecommendations()
        };
        
        return report;
    }
    
    /**
     * 生成总体建议
     */
    generateOverallRecommendations() {
        const recommendations = [];
        
        // 整合建议
        const highPriorityIntegrations = this.integrationSuggestions.filter(s => s.priority === 'high');
        if (highPriorityIntegrations.length > 0) {
            recommendations.push({
                type: 'integration',
                priority: 'high',
                message: `发现 ${highPriorityIntegrations.length} 个高优先级整合机会`,
                details: highPriorityIntegrations
            });
        }
        
        // 清理建议
        const lowValueDocs = this.valueAssessment.filter(v => v.value.level === 'very-low');
        if (lowValueDocs.length > 0) {
            recommendations.push({
                type: 'cleanup',
                priority: 'medium',
                message: `发现 ${lowValueDocs.length} 个低价值文档，建议清理`,
                details: lowValueDocs.map(d => d.path)
            });
        }
        
        // 结构化建议
        const unstructuredDocs = this.documents.filter(doc => 
            !doc.analysis.hasHeaders && doc.analysis.wordCount > 200
        );
        if (unstructuredDocs.length > 0) {
            recommendations.push({
                type: 'structure',
                priority: 'low',
                message: `发现 ${unstructuredDocs.length} 个缺少结构的文档，建议重新组织`,
                details: unstructuredDocs.map(d => d.path)
            });
        }
        
        return recommendations;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const projectRoot = process.argv[2] || process.cwd();
    const analyzer = new ContentAnalyzer(projectRoot);
    
    analyzer.analyze().then(report => {
        console.log('\n📊 内容分析报告:');
        console.log('================');
        console.log(`总文档数: ${report.summary.totalDocuments}`);
        console.log(`相似文档对: ${report.summary.similarPairs}`);
        console.log(`整合建议: ${report.summary.integrationSuggestions}`);
        console.log(`高价值文档: ${report.summary.highValueDocs}`);
        console.log(`低价值文档: ${report.summary.lowValueDocs}`);
        
        console.log('\n💡 总体建议:');
        report.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
        });
        
        // 保存详细报告
        const reportPath = path.join(projectRoot, 'docs', 'content-analysis-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 详细报告已保存到: ${reportPath}`);
        
    }).catch(error => {
        console.error('❌ 分析过程中出现错误:', error);
        process.exit(1);
    });
}

module.exports = ContentAnalyzer;