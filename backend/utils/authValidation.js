/**
 * 认证逻辑验证工具
 * 验证中间件和路由的认证逻辑是否正确
 */

const fs = require('fs');
const path = require('path');

/**
 * 检查文件中的认证相关代码
 * @param {string} filePath - 文件路径
 * @returns {Object} 检查结果
 */
const checkAuthLogic = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const issues = [];
    const goodPractices = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const lineNumber = index + 1;
      
      // 检查重复的用户验证
      if (trimmedLine.includes('if (!req.user)') || trimmedLine.includes('if(!req.user)')) {
        issues.push({
          type: 'redundant_user_check',
          line: lineNumber,
          content: trimmedLine,
          message: '冗余的用户检查：应该在中间件中处理'
        });
      }
      
      // 检查直接返回401的情况
      if (trimmedLine.includes('UNAUTHORIZED') && trimmedLine.includes('401')) {
        if (trimmedLine.includes('用户未登录')) {
          issues.push({
            type: 'redundant_auth_error',
            line: lineNumber,
            content: trimmedLine,
            message: '冗余的认证错误：中间件已处理'
          });
        }
      }
      
      // 检查正确使用req.user的情况
      if (trimmedLine.includes('req.user.') && !trimmedLine.includes('if (!req.user)')) {
        goodPractices.push({
          type: 'correct_user_usage',
          line: lineNumber,
          content: trimmedLine,
          message: '正确使用req.user：直接访问用户信息'
        });
      }
    });
    
    return {
      file: filePath,
      issues,
      goodPractices,
      hasIssues: issues.length > 0
    };
    
  } catch (error) {
    return {
      file: filePath,
      error: error.message,
      hasIssues: true
    };
  }
};

/**
 * 检查项目中的所有路由文件
 * @param {string} routesDir - 路由目录
 * @returns {Object} 检查结果
 */
const checkProjectAuth = (routesDir) => {
  const results = [];
  
  try {
    const files = fs.readdirSync(routesDir);
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        const filePath = path.join(routesDir, file);
        const result = checkAuthLogic(filePath);
        results.push(result);
      }
    }
    
    return {
      totalFiles: results.length,
      filesWithIssues: results.filter(r => r.hasIssues).length,
      results
    };
    
  } catch (error) {
    return {
      error: error.message,
      results: []
    };
  }
};

/**
 * 生成认证检查报告
 * @param {Object} checkResult - 检查结果
 */
const generateAuthReport = (checkResult) => {
  console.log('\n🔐 认证逻辑检查报告');
  console.log('=' .repeat(50));
  
  if (checkResult.error) {
    console.log('❌ 检查失败:', checkResult.error);
    return;
  }
  
  console.log(`📊 检查了 ${checkResult.totalFiles} 个路由文件`);
  console.log(`⚠️  发现 ${checkResult.filesWithIssues} 个文件有问题\n`);
  
  if (checkResult.filesWithIssues === 0) {
    console.log('✅ 所有文件的认证逻辑都正确！');
    console.log('💡 中间件正确处理了认证，路由直接使用 req.user');
    return;
  }
  
  for (const result of checkResult.results) {
    if (result.hasIssues && !result.error) {
      console.log(`📄 ${path.basename(result.file)}`);
      
      for (const issue of result.issues) {
        console.log(`  ❌ 第${issue.line}行: ${issue.message}`);
        console.log(`     ${issue.content}`);
      }
      
      if (result.goodPractices.length > 0) {
        console.log(`  ✅ 正确使用 req.user: ${result.goodPractices.length} 处`);
      }
      
      console.log('');
    }
  }
  
  console.log('💡 修复建议:');
  console.log('1. 移除路由中的 if (!req.user) 检查');
  console.log('2. 移除路由中的 UNAUTHORIZED 错误返回');
  console.log('3. 直接使用 req.user，中间件保证其存在');
};

/**
 * 验证中间件逻辑
 * @param {string} middlewarePath - 中间件文件路径
 * @returns {Object} 验证结果
 */
const validateMiddleware = (middlewarePath) => {
  try {
    const content = fs.readFileSync(middlewarePath, 'utf8');
    
    const checks = {
      hasPublicRouteCheck: content.includes('isPublicRoute'),
      hasTokenValidation: content.includes('jwt.verify'),
      setsUserInfo: content.includes('req.user'),
      returnsErrorOnFailure: content.includes('sendError') && content.includes('401'),
      callsNext: content.includes('next()')
    };
    
    const allPassed = Object.values(checks).every(check => check);
    
    return {
      file: middlewarePath,
      checks,
      allPassed,
      message: allPassed ? '中间件逻辑正确' : '中间件逻辑需要检查'
    };
    
  } catch (error) {
    return {
      file: middlewarePath,
      error: error.message,
      allPassed: false
    };
  }
};

module.exports = {
  checkAuthLogic,
  checkProjectAuth,
  generateAuthReport,
  validateMiddleware
};
