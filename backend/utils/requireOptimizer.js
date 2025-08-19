/**
 * Require 语句优化工具
 * 帮助检查和优化项目中的重复 require 语句
 */

const fs = require('fs');
const path = require('path');

/**
 * 分析文件中的 require 语句
 * @param {string} filePath - 文件路径
 * @returns {Object} 分析结果
 */
const analyzeRequires = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const requires = {
      top: [], // 顶部的 require
      inline: [], // 函数内部的 require
      duplicates: [] // 重复的 require
    };
    
    const seenRequires = new Map();
    let inFunction = false;
    let braceCount = 0;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // 检测是否在函数内部
      if (trimmedLine.includes('{')) {
        braceCount += (trimmedLine.match(/\{/g) || []).length;
        if (braceCount > 0) inFunction = true;
      }
      if (trimmedLine.includes('}')) {
        braceCount -= (trimmedLine.match(/\}/g) || []).length;
        if (braceCount <= 0) inFunction = false;
      }
      
      // 检测 require 语句
      const requireMatch = trimmedLine.match(/const\s+.*?=\s+require\(['"`]([^'"`]+)['"`]\)/);
      if (requireMatch) {
        const modulePath = requireMatch[1];
        const fullLine = trimmedLine;
        
        const requireInfo = {
          line: index + 1,
          content: fullLine,
          module: modulePath,
          inFunction
        };
        
        if (inFunction) {
          requires.inline.push(requireInfo);
        } else {
          requires.top.push(requireInfo);
        }
        
        // 检查重复
        if (seenRequires.has(modulePath)) {
          requires.duplicates.push({
            module: modulePath,
            first: seenRequires.get(modulePath),
            duplicate: requireInfo
          });
        } else {
          seenRequires.set(modulePath, requireInfo);
        }
      }
    });
    
    return requires;
    
  } catch (error) {
    console.error(`分析文件 ${filePath} 失败:`, error.message);
    return null;
  }
};

/**
 * 生成优化建议
 * @param {Object} analysis - 分析结果
 * @returns {Array} 优化建议
 */
const generateOptimizationSuggestions = (analysis) => {
  const suggestions = [];
  
  if (analysis.duplicates.length > 0) {
    suggestions.push({
      type: 'duplicates',
      message: `发现 ${analysis.duplicates.length} 个重复的 require 语句`,
      details: analysis.duplicates.map(dup => ({
        module: dup.module,
        firstLine: dup.first.line,
        duplicateLine: dup.duplicate.line
      }))
    });
  }
  
  if (analysis.inline.length > 0) {
    const movableRequires = analysis.inline.filter(req => 
      !analysis.top.some(topReq => topReq.module === req.module)
    );
    
    if (movableRequires.length > 0) {
      suggestions.push({
        type: 'moveToTop',
        message: `建议将 ${movableRequires.length} 个 require 语句移到文件顶部`,
        details: movableRequires.map(req => ({
          module: req.module,
          line: req.line,
          content: req.content
        }))
      });
    }
  }
  
  return suggestions;
};

/**
 * 扫描目录中的所有 JS 文件
 * @param {string} dirPath - 目录路径
 * @returns {Array} 文件列表
 */
const scanJSFiles = (dirPath) => {
  const files = [];
  
  const scan = (currentPath) => {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scan(fullPath);
      } else if (stat.isFile() && item.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  };
  
  scan(dirPath);
  return files;
};

/**
 * 分析整个项目的 require 使用情况
 * @param {string} projectPath - 项目路径
 * @returns {Object} 项目分析结果
 */
const analyzeProject = (projectPath) => {
  const jsFiles = scanJSFiles(projectPath);
  const results = {};
  
  console.log(`🔍 扫描到 ${jsFiles.length} 个 JS 文件`);
  
  for (const file of jsFiles) {
    const relativePath = path.relative(projectPath, file);
    const analysis = analyzeRequires(file);
    
    if (analysis) {
      const suggestions = generateOptimizationSuggestions(analysis);
      
      if (suggestions.length > 0) {
        results[relativePath] = {
          analysis,
          suggestions
        };
      }
    }
  }
  
  return results;
};

/**
 * 生成优化报告
 * @param {Object} projectAnalysis - 项目分析结果
 */
const generateReport = (projectAnalysis) => {
  console.log('\n📊 Require 语句优化报告');
  console.log('=' .repeat(50));
  
  const fileCount = Object.keys(projectAnalysis).length;
  
  if (fileCount === 0) {
    console.log('✅ 所有文件的 require 语句都已优化！');
    return;
  }
  
  console.log(`⚠️  发现 ${fileCount} 个文件需要优化：\n`);
  
  for (const [file, result] of Object.entries(projectAnalysis)) {
    console.log(`📄 ${file}`);
    
    for (const suggestion of result.suggestions) {
      switch (suggestion.type) {
        case 'duplicates':
          console.log(`  🔄 ${suggestion.message}`);
          for (const detail of suggestion.details) {
            console.log(`     - ${detail.module}: 第${detail.firstLine}行 和 第${detail.duplicateLine}行`);
          }
          break;
          
        case 'moveToTop':
          console.log(`  ⬆️  ${suggestion.message}`);
          for (const detail of suggestion.details) {
            console.log(`     - 第${detail.line}行: ${detail.module}`);
          }
          break;
      }
    }
    console.log('');
  }
  
  console.log('💡 建议：');
  console.log('1. 将重复的 require 语句合并到文件顶部');
  console.log('2. 移除函数内部不必要的 require 语句');
  console.log('3. 按模块类型对 require 语句进行分组');
};

module.exports = {
  analyzeRequires,
  generateOptimizationSuggestions,
  analyzeProject,
  generateReport
};
