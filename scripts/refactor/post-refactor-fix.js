#!/usr/bin/env node

/**
 * 重构后修复脚本
 * 修复重构过程中的问题，创建适当的README文件
 */

const fs = require('fs');
const path = require('path');

class PostRefactorFix {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }
    
    /**
     * 执行修复
     */
    async fix() {
        console.log('🔧 开始重构后修复...');
        
        await this.createProperReadmeFiles();
        await this.createDirectoryIndexes();
        await this.updateMainReadme();
        await this.cleanupDuplicates();
        
        console.log('✅ 修复完成！');
    }
    
    /**
     * 创建适当的README文件
     */
    async createProperReadmeFiles() {
        console.log('📝 创建适当的README文件...');
        
        // 为每个主要目录创建README
        const directories = {
            'docs': {
                title: '📚 项目文档',
                description: '本目录包含YouTube Scraper项目的所有文档',
                subdirs: {
                    'getting-started': '🚀 入门指南和快速开始',
                    'development': '💻 开发文档和指南',
                    'architecture': '🏗️ 架构设计和技术规范',
                    'features': '✨ 功能说明和用户指南',
                    'operations': '⚙️ 运维部署和维护文档',
                    'archive': '📦 归档文档'
                }
            },
            'scripts': {
                title: '🛠️ 项目脚本',
                description: '本目录包含项目的所有自动化脚本',
                subdirs: {
                    'database': '🗄️ 数据库操作脚本',
                    'deployment': '🚀 部署脚本',
                    'development': '💻 开发辅助脚本',
                    'i18n': '🌍 国际化脚本',
                    'maintenance': '🧹 维护和清理脚本',
                    'utils': '🔧 通用工具脚本',
                    'refactor': '🔄 重构工具脚本',
                    'archive': '📦 归档脚本'
                }
            }
        };
        
        for (const [dirName, config] of Object.entries(directories)) {
            await this.createDirectoryReadme(dirName, config);
        }
    }
    
    /**
     * 创建目录README
     */
    async createDirectoryReadme(dirName, config) {
        const dirPath = path.join(this.projectRoot, dirName);
        const readmePath = path.join(dirPath, 'README.md');
        
        let content = `# ${config.title}\n\n${config.description}\n\n## 目录结构\n\n`;
        
        // 添加子目录说明
        for (const [subdir, desc] of Object.entries(config.subdirs)) {
            const subdirPath = path.join(dirPath, subdir);
            if (fs.existsSync(subdirPath)) {
                content += `- **${subdir}/** - ${desc}\n`;
            }
        }
        
        content += `\n## 使用说明\n\n`;
        
        if (dirName === 'docs') {
            content += `本文档采用分类组织的方式：\n\n`;
            content += `1. **getting-started/** - 新用户从这里开始\n`;
            content += `2. **development/** - 开发者参考文档\n`;
            content += `3. **architecture/** - 系统架构和设计\n`;
            content += `4. **features/** - 功能特性说明\n`;
            content += `5. **operations/** - 部署和运维指南\n`;
            content += `6. **archive/** - 历史文档归档\n\n`;
        } else if (dirName === 'scripts') {
            content += `脚本按功能分类组织：\n\n`;
            content += `- 使用前请确保已安装必要的依赖\n`;
            content += `- 大部分脚本可以直接通过 \`node scripts/category/script-name.js\` 运行\n`;
            content += `- 详细使用说明请查看各脚本文件的注释\n\n`;
        }
        
        content += `---\n*此文件由重构工具自动生成*\n`;
        
        fs.writeFileSync(readmePath, content);
        console.log(`📄 创建 ${dirName}/README.md`);
    }
    
    /**
     * 创建目录索引
     */
    async createDirectoryIndexes() {
        console.log('📋 创建目录索引...');
        
        // 为docs目录创建详细索引
        await this.createDocsIndex();
        
        // 为scripts目录创建脚本索引
        await this.createScriptsIndex();
    }
    
    /**
     * 创建文档索引
     */
    async createDocsIndex() {
        const docsPath = path.join(this.projectRoot, 'docs');
        const indexPath = path.join(docsPath, 'INDEX.md');
        
        let content = `# 📚 文档索引\n\n`;
        content += `本索引列出了项目中所有重要的文档文件。\n\n`;
        
        const categories = [
            'getting-started',
            'development', 
            'architecture',
            'features',
            'operations',
            'archive'
        ];
        
        for (const category of categories) {
            const categoryPath = path.join(docsPath, category);
            if (fs.existsSync(categoryPath)) {
                content += `## ${this.getCategoryTitle(category)}\n\n`;
                
                const files = fs.readdirSync(categoryPath);
                for (const file of files) {
                    if (file.endsWith('.md')) {
                        const filePath = path.join(categoryPath, file);
                        const title = this.extractTitle(filePath) || file.replace('.md', '');
                        content += `- [${title}](./${category}/${file})\n`;
                    }
                }
                content += `\n`;
            }
        }
        
        content += `---\n*最后更新: ${new Date().toISOString().split('T')[0]}*\n`;
        
        fs.writeFileSync(indexPath, content);
        console.log('📄 创建 docs/INDEX.md');
    }
    
    /**
     * 创建脚本索引
     */
    async createScriptsIndex() {
        const scriptsPath = path.join(this.projectRoot, 'scripts');
        const indexPath = path.join(scriptsPath, 'INDEX.md');
        
        let content = `# 🛠️ 脚本索引\n\n`;
        content += `本索引列出了项目中所有可用的脚本文件。\n\n`;
        
        const categories = [
            'database',
            'deployment',
            'development',
            'i18n',
            'maintenance',
            'utils',
            'refactor'
        ];
        
        for (const category of categories) {
            const categoryPath = path.join(scriptsPath, category);
            if (fs.existsSync(categoryPath)) {
                content += `## ${this.getScriptCategoryTitle(category)}\n\n`;
                
                await this.scanScriptDirectory(categoryPath, content, category);
                content += `\n`;
            }
        }
        
        content += `## 使用说明\n\n`;
        content += `1. 确保已安装Node.js和项目依赖\n`;
        content += `2. 在项目根目录运行脚本: \`node scripts/category/script-name.js\`\n`;
        content += `3. 某些脚本可能需要特定的环境变量或参数\n\n`;
        
        content += `---\n*最后更新: ${new Date().toISOString().split('T')[0]}*\n`;
        
        fs.writeFileSync(indexPath, content);
        console.log('📄 创建 scripts/INDEX.md');
    }
    
    /**
     * 扫描脚本目录
     */
    async scanScriptDirectory(dirPath, content, category, level = 0) {
        const items = fs.readdirSync(dirPath);
        const indent = '  '.repeat(level);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                content += `${indent}- **${item}/**\n`;
                await this.scanScriptDirectory(itemPath, content, category, level + 1);
            } else if (item.endsWith('.js')) {
                const description = this.extractScriptDescription(itemPath);
                const relativePath = path.relative(path.join(this.projectRoot, 'scripts'), itemPath);
                content += `${indent}- [${item}](./${relativePath}) - ${description}\n`;
            }
        }
    }
    
    /**
     * 提取文档标题
     */
    extractTitle(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const match = content.match(/^#\s+(.+)$/m);
            return match ? match[1] : null;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * 提取脚本描述
     */
    extractScriptDescription(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            // 查找注释中的描述
            for (let i = 0; i < Math.min(10, lines.length); i++) {
                const line = lines[i].trim();
                if (line.startsWith('*') && line.includes('用于') || line.includes('功能')) {
                    return line.replace(/^\*\s*/, '').replace(/\*$/, '').trim();
                }
            }
            
            return '脚本文件';
        } catch (error) {
            return '脚本文件';
        }
    }
    
    /**
     * 获取分类标题
     */
    getCategoryTitle(category) {
        const titles = {
            'getting-started': '🚀 入门指南',
            'development': '💻 开发文档',
            'architecture': '🏗️ 架构设计',
            'features': '✨ 功能特性',
            'operations': '⚙️ 运维部署',
            'archive': '📦 归档文档'
        };
        return titles[category] || category;
    }
    
    /**
     * 获取脚本分类标题
     */
    getScriptCategoryTitle(category) {
        const titles = {
            'database': '🗄️ 数据库脚本',
            'deployment': '🚀 部署脚本',
            'development': '💻 开发脚本',
            'i18n': '🌍 国际化脚本',
            'maintenance': '🧹 维护脚本',
            'utils': '🔧 工具脚本',
            'refactor': '🔄 重构脚本'
        };
        return titles[category] || category;
    }
    
    /**
     * 更新主README
     */
    async updateMainReadme() {
        console.log('📝 更新主README文件...');
        
        const mainReadmePath = path.join(this.projectRoot, 'README.md');
        
        // 检查是否存在主README，如果不存在则创建
        if (!fs.existsSync(mainReadmePath)) {
            const content = `# YouTube Scraper

一个现代化的YouTube数据分析平台，支持多语言和团队协作。

## 🚀 快速开始

请查看 [入门指南](./docs/getting-started/README.md) 开始使用。

## 📚 文档

- [📋 文档索引](./docs/INDEX.md) - 所有文档的完整索引
- [🚀 入门指南](./docs/getting-started/) - 新用户从这里开始
- [💻 开发文档](./docs/development/) - 开发者参考
- [🏗️ 架构设计](./docs/architecture/) - 系统架构说明
- [✨ 功能特性](./docs/features/) - 功能说明和用户指南
- [⚙️ 运维部署](./docs/operations/) - 部署和维护指南

## 🛠️ 脚本工具

- [📋 脚本索引](./scripts/INDEX.md) - 所有脚本的完整索引
- [🗄️ 数据库脚本](./scripts/database/) - 数据库操作
- [🚀 部署脚本](./scripts/deployment/) - 自动化部署
- [💻 开发脚本](./scripts/development/) - 开发辅助工具
- [🌍 国际化脚本](./scripts/i18n/) - 多语言支持
- [🧹 维护脚本](./scripts/maintenance/) - 系统维护

## 🏗️ 项目结构

\`\`\`
youtube-scraper/
├── docs/                 # 📚 项目文档
│   ├── getting-started/   # 🚀 入门指南
│   ├── development/       # 💻 开发文档
│   ├── architecture/      # 🏗️ 架构设计
│   ├── features/          # ✨ 功能特性
│   ├── operations/        # ⚙️ 运维部署
│   └── archive/           # 📦 归档文档
├── scripts/              # 🛠️ 自动化脚本
│   ├── database/         # 🗄️ 数据库操作
│   ├── deployment/       # 🚀 部署脚本
│   ├── development/      # 💻 开发辅助
│   ├── i18n/            # 🌍 国际化
│   ├── maintenance/      # 🧹 维护脚本
│   └── utils/           # 🔧 工具脚本
├── src/                 # 💻 源代码
└── public/              # 🌐 静态资源
\`\`\`

## 🤝 贡献

欢迎贡献代码！请查看 [开发文档](./docs/development/) 了解如何参与项目开发。

## 📄 许可证

本项目采用 MIT 许可证。

---

*项目结构已于 ${new Date().toISOString().split('T')[0]} 重构优化*
`;
            
            fs.writeFileSync(mainReadmePath, content);
            console.log('📄 创建主README.md');
        } else {
            console.log('📄 主README.md已存在，跳过更新');
        }
    }
    
    /**
     * 清理重复文件
     */
    async cleanupDuplicates() {
        console.log('🧹 清理重复和临时文件...');
        
        // 清理可能的重复README文件
        const duplicatePatterns = [
            'docs/getting-started/README.md.1',
            'docs/getting-started/README.md.bak'
        ];
        
        for (const pattern of duplicatePatterns) {
            const filePath = path.join(this.projectRoot, pattern);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️  删除重复文件: ${pattern}`);
            }
        }
        
        // 清理空的或无效的README文件
        const readmeFiles = [
            'docs/getting-started/README.md',
            'scripts/README.md'
        ];
        
        for (const readmeFile of readmeFiles) {
            const filePath = path.join(this.projectRoot, readmeFile);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.trim().length < 50) {
                    console.log(`⚠️  发现内容过少的README: ${readmeFile}`);
                }
            }
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const projectRoot = process.argv[2] || process.cwd();
    const fixer = new PostRefactorFix(projectRoot);
    
    fixer.fix().then(() => {
        console.log('\n🎉 重构后修复完成！');
        console.log('📚 文档结构已优化');
        console.log('🛠️ 脚本组织已完善');
        console.log('📋 索引文件已创建');
    }).catch(error => {
        console.error('❌ 修复过程中出现错误:', error);
        process.exit(1);
    });
}

module.exports = PostRefactorFix;