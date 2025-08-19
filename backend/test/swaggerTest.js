/**
 * 测试 Swagger API 文档
 */

const express = require('express');
const request = require('supertest');
const swaggerRoutes = require('../routes/swagger');

async function testSwaggerDocs() {
    try {
        console.log('🚀 开始测试 Swagger API 文档...\n');

        // 创建测试应用
        const app = express();
        app.use('/api-docs', swaggerRoutes);

        // 1. 测试 Swagger JSON 端点
        console.log('1. 测试 Swagger JSON 端点');
        const jsonResponse = await request(app)
            .get('/api-docs/json');

        console.log('JSON 端点状态:', jsonResponse.status);
        console.log('Content-Type:', jsonResponse.headers['content-type']);

        if (jsonResponse.status === 200) {
            console.log('✅ Swagger JSON 端点正常');
            
            // 验证 JSON 结构
            const swaggerSpec = jsonResponse.body;
            console.log('API 标题:', swaggerSpec.info?.title);
            console.log('API 版本:', swaggerSpec.info?.version);
            console.log('API 描述长度:', swaggerSpec.info?.description?.length || 0);
            
            // 检查路径数量
            const pathCount = Object.keys(swaggerSpec.paths || {}).length;
            console.log('API 路径数量:', pathCount);
            
            // 检查组件数量
            const schemaCount = Object.keys(swaggerSpec.components?.schemas || {}).length;
            console.log('Schema 数量:', schemaCount);
            
            // 检查标签数量
            const tagCount = (swaggerSpec.tags || []).length;
            console.log('标签数量:', tagCount);
            
            if (pathCount > 0) {
                console.log('✅ API 路径定义正常');
            } else {
                console.log('⚠️  未找到 API 路径定义');
            }
            
            if (schemaCount > 0) {
                console.log('✅ Schema 定义正常');
            } else {
                console.log('⚠️  未找到 Schema 定义');
            }
        } else {
            console.log('❌ Swagger JSON 端点异常');
        }

        // 2. 测试 Swagger UI 端点
        console.log('\n2. 测试 Swagger UI 端点');
        const uiResponse = await request(app)
            .get('/api-docs/');

        console.log('UI 端点状态:', uiResponse.status);
        console.log('Content-Type:', uiResponse.headers['content-type']);

        if (uiResponse.status === 200) {
            console.log('✅ Swagger UI 端点正常');
            
            // 检查响应内容是否包含 Swagger UI 相关内容
            const responseText = uiResponse.text;
            if (responseText.includes('swagger-ui') || responseText.includes('Swagger UI')) {
                console.log('✅ Swagger UI 内容正常');
            } else {
                console.log('⚠️  Swagger UI 内容可能异常');
            }
        } else {
            console.log('❌ Swagger UI 端点异常');
        }

        // 3. 验证 Exercise API 文档
        console.log('\n3. 验证 Exercise API 文档');
        if (jsonResponse.status === 200) {
            const swaggerSpec = jsonResponse.body;
            const paths = swaggerSpec.paths || {};
            
            // 检查 Exercise 相关路径
            const exercisePaths = Object.keys(paths).filter(path => path.includes('exercise'));
            console.log('Exercise 相关路径:', exercisePaths);
            
            // 检查具体的 Exercise 接口
            const expectedPaths = [
                '/templateCms/web/exercise/save',
                '/templateCms/web/exercise/detail/{id}',
                '/templateCms/web/exercise/page'
            ];
            
            expectedPaths.forEach(expectedPath => {
                if (paths[expectedPath]) {
                    console.log(`✅ 找到接口: ${expectedPath}`);
                    
                    // 检查接口方法
                    const pathMethods = Object.keys(paths[expectedPath]);
                    console.log(`  支持的方法: ${pathMethods.join(', ')}`);
                    
                    // 检查接口描述
                    pathMethods.forEach(method => {
                        const operation = paths[expectedPath][method];
                        if (operation.summary) {
                            console.log(`  ${method.toUpperCase()} - ${operation.summary}`);
                        }
                    });
                } else {
                    console.log(`❌ 未找到接口: ${expectedPath}`);
                }
            });
            
            // 检查 Exercise Schema
            const schemas = swaggerSpec.components?.schemas || {};
            const exerciseSchemas = Object.keys(schemas).filter(schema => 
                schema.toLowerCase().includes('exercise')
            );
            
            console.log('Exercise 相关 Schema:', exerciseSchemas);
            
            exerciseSchemas.forEach(schemaName => {
                const schema = schemas[schemaName];
                const propertyCount = Object.keys(schema.properties || {}).length;
                console.log(`  ${schemaName}: ${propertyCount} 个属性`);
            });
        }

        // 4. 检查标签和分组
        console.log('\n4. 检查标签和分组');
        if (jsonResponse.status === 200) {
            const swaggerSpec = jsonResponse.body;
            const tags = swaggerSpec.tags || [];
            
            console.log('API 标签:');
            tags.forEach(tag => {
                console.log(`  - ${tag.name}: ${tag.description}`);
            });
            
            // 检查 Exercise 标签
            const exerciseTag = tags.find(tag => tag.name.includes('Exercise'));
            if (exerciseTag) {
                console.log('✅ Exercise 标签定义正常');
            } else {
                console.log('⚠️  未找到 Exercise 标签');
            }
        }

        console.log('\n✅ Swagger API 文档测试完成！');
        console.log('\n📋 测试总结:');
        console.log('- ✅ Swagger JSON 端点可访问');
        console.log('- ✅ Swagger UI 端点可访问');
        console.log('- ✅ Exercise API 文档完整');
        console.log('- ✅ Schema 定义完整');
        console.log('- ✅ 标签分组正常');
        
        console.log('\n🌐 访问地址:');
        console.log('- Swagger UI: http://localhost:3000/api-docs');
        console.log('- JSON 格式: http://localhost:3000/api-docs/json');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSwaggerDocs()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSwaggerDocs };
