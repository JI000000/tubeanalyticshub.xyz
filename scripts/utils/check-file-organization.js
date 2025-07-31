#!/usr/bin/env node

/**
 * 📁 文件组织规范检查工具
 * 
 * 功能：
 * 1. 检查根目录是否有违规文档文件
 * 2. 检查scripts目录结构是否规范
 * 3. 验证报告文件是否放在正确位置
 */

const fs = require('fs');
const path = require('path');

class FileOrganizationChecker {
    constructor() {
        this.violations = [];
        this.projectRoot = path.join(__dirname, '..', '..');
    }

    checkRootDirectory() {
        console.log('🔍 检查根目录...');

        const rootFiles = fs.readdirSync(this.projectRoot);
        const violationPatterns = [
            /.*_PLAN\.md$/,
            /.*_SUMMARY\.md$/,
            /.*_EXECUTION\.md$/,
            /.*_REPORT\.md$/,
            /.*ORGANIZATION.*\.md$/,
            /.*CLEANUP.*\.md$/
        ];

        rootFiles.forEach(file => {
            if (violationPatterns.some(pattern => pattern.test(file))) {
                this.violations.push({
                    type: 'ROOT_DOCUMENT_VIOLATION',
                    file: file,
                    message: `文档文件 "${file}" 不应该在根目录，应该移动到 docs/ 目录`,
                    severity: 'HIGH'
                });
            }
        });
    }

    checkScriptsDirectory() {
        console.log('🔍 检查scripts目录...');

        const scriptsPath = path.join(this.projectRoot, 'scripts');
        if (!fs.existsSync(scriptsPath)) return;

        const scriptsFiles = fs.readdirSync(scriptsPath);

        // 检查scripts主目录中不应该存在的文件
        const allowedInScriptsRoot = [
            'README.md',
            'i18n-toolkit.js'
        ];

        scriptsFiles.forEach(file => {
            const filePath = path.join(scriptsPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isFile() && !allowedInScriptsRoot.includes(file)) {
                if (file.endsWith('.json')) {
                    this.violations.push({
                        type: 'SCRIPTS_REPORT_VIOLATION',
                        file: `scripts/${file}`,
                        message: `报告文件 "${file}" 应该移动到对应的 reports/ 子目录`,
                        severity: 'MEDIUM'
                    });
                } else if (file.endsWith('.js') && file !== 'i18n-toolkit.js') {
                    this.violations.push({
                        type: 'SCRIPTS_STRUCTURE_VIOLATION',
                        file: `scripts/${file}`,
                        message: `脚本文件 "${file}" 应该移动到对应的功能子目录`,
                        severity: 'MEDIUM'
                    });
                }
            }
        });
    }

    checkReportsDirectories() {
        console.log('🔍 检查reports目录结构...');

        const scriptsPath = path.join(this.projectRoot, 'scripts');
        const subdirs = ['i18n', 'database', 'analytics'];

        subdirs.forEach(subdir => {
            const subdirPath = path.join(scriptsPath, subdir);
            if (!fs.existsSync(subdirPath)) return;

            const reportsPath = path.join(subdirPath, 'reports');
            const files = fs.readdirSync(subdirPath);

            files.forEach(file => {
                if (file.endsWith('.json') || file.endsWith('.log')) {
                    if (!fs.existsSync(reportsPath)) {
                        this.violations.push({
                            type: 'MISSING_REPORTS_DIR',
                            file: `scripts/${subdir}/${file}`,
                            message: `缺少 reports/ 目录，报告文件 "${file}" 无处安放`,
                            severity: 'LOW'
                        });
                    }
                }
            });
        });
    }

    checkDocsDirectory() {
        console.log('🔍 检查docs目录结构...');

        const docsPath = path.join(this.projectRoot, 'docs');
        if (!fs.existsSync(docsPath)) return;

        // 检查docs根目录不应该有的文件
        const docsFiles = fs.readdirSync(docsPath);
        const allowedInDocsRoot = ['README.md'];

        docsFiles.forEach(file => {
            const filePath = path.join(docsPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isFile() && !allowedInDocsRoot.includes(file)) {
                // 检查是否应该在reports目录
                if (file.includes('CLEANUP') || file.includes('EXECUTION') ||
                    file.includes('PLAN') || file.includes('SUMMARY') ||
                    file.includes('REPORT')) {
                    this.violations.push({
                        type: 'DOCS_MISPLACED_REPORT',
                        file: `docs/${file}`,
                        message: `报告文档 "${file}" 应该移动到 docs/09-reports/analysis-reports/`,
                        severity: 'MEDIUM'
                    });
                } else {
                    this.violations.push({
                        type: 'DOCS_ROOT_VIOLATION',
                        file: `docs/${file}`,
                        message: `文档 "${file}" 应该移动到对应的子目录`,
                        severity: 'LOW'
                    });
                }
            }
        });

        // 检查重复文件
        this.checkDuplicateFiles();
    }

    checkDuplicateFiles() {
        const docsPath = path.join(this.projectRoot, 'docs');
        const duplicatePatterns = new Map();

        // 递归检查所有子目录
        const checkDir = (dir, relativePath = '') => {
            const items = fs.readdirSync(dir);

            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    checkDir(fullPath, path.join(relativePath, item));
                } else if (item.endsWith('.md')) {
                    // 标准化文件名进行比较
                    const normalizedName = item.toLowerCase()
                        .replace(/[-_]/g, '')
                        .replace(/\.md$/, '');

                    if (!duplicatePatterns.has(normalizedName)) {
                        duplicatePatterns.set(normalizedName, []);
                    }

                    duplicatePatterns.get(normalizedName).push({
                        file: path.join(relativePath, item),
                        fullPath: fullPath
                    });
                }
            });
        };

        checkDir(docsPath);

        // 检查重复
        duplicatePatterns.forEach((files, pattern) => {
            if (files.length > 1) {
                this.violations.push({
                    type: 'DOCS_DUPLICATE_FILES',
                    file: files.map(f => `docs/${f.file}`).join(', '),
                    message: `发现重复文档: ${files.map(f => f.file).join(', ')}`,
                    severity: 'MEDIUM'
                });
            }
        });
    }

    generateReport() {
        console.log('\n📋 文件组织检查报告');
        console.log('===================');

        if (this.violations.length === 0) {
            console.log('✅ 所有文件组织规范检查通过！');
            return true;
        }

        console.log(`❌ 发现 ${this.violations.length} 个违规问题:\n`);

        const severityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
        this.violations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        this.violations.forEach((violation, index) => {
            const icon = violation.severity === 'HIGH' ? '🚨' :
                violation.severity === 'MEDIUM' ? '⚠️' : '💡';

            console.log(`${icon} ${index + 1}. [${violation.severity}] ${violation.type}`);
            console.log(`   文件: ${violation.file}`);
            console.log(`   问题: ${violation.message}\n`);
        });

        console.log('🔧 修复建议:');
        console.log('1. 将根目录的文档文件移动到 docs/ 对应子目录');
        console.log('2. 将scripts主目录的报告文件移动到对应的 reports/ 子目录');
        console.log('3. 将错误放置的脚本文件移动到对应的功能子目录');

        return false;
    }

    run() {
        console.log('🚀 开始文件组织规范检查...\n');

        this.checkRootDirectory();
        this.checkScriptsDirectory();
        this.checkReportsDirectories();

        const passed = this.generateReport();

        if (!passed) {
            console.log('\n📖 请参考: docs/04-development/FILE_ORGANIZATION_RULES.md');
            process.exit(1);
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const checker = new FileOrganizationChecker();
    checker.run();
}

module.exports = FileOrganizationChecker;