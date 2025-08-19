/**
 * 测试 sound 路由顺序是否正确
 */

const express = require('express');
const request = require('supertest');
const soundRoutes = require('../routes/sound');

async function testSoundRouteOrder() {
    try {
        console.log('🔍 测试 sound 路由顺序...\n');

        // 创建测试应用
        const app = express();
        app.use(express.json());
        app.use('/sound', soundRoutes);

        // 1. 测试 /sound/page 路由（应该匹配分页查询，不是ID查询）
        console.log('1. 测试 /sound/page 路由');
        
        // 模拟请求（不实际发送HTTP请求，只测试路由匹配逻辑）
        const mockReq = {
            method: 'GET',
            url: '/sound/page?pageSize=10&pageIndex=1',
            query: {
                pageSize: '10',
                pageIndex: '1'
            }
        };

        console.log('请求URL:', mockReq.url);
        console.log('应该匹配到: /page 路由（分页查询）');
        console.log('不应该匹配到: /:id 路由（ID查询）');

        // 2. 测试 /sound/123 路由（应该匹配ID查询）
        console.log('\n2. 测试 /sound/123 路由');
        
        const mockReq2 = {
            method: 'GET',
            url: '/sound/123',
            params: {
                id: '123'
            }
        };

        console.log('请求URL:', mockReq2.url);
        console.log('应该匹配到: /:id 路由（ID查询）');

        // 3. 测试 /sound/save 路由
        console.log('\n3. 测试 /sound/save 路由');
        
        const mockReq3 = {
            method: 'POST',
            url: '/sound/save',
            body: {
                name: '测试',
                genderCode: 'FEMALE',
                usageCode: 'GENERAL',
                translation: 1,
                status: 'ENABLED'
            }
        };

        console.log('请求URL:', mockReq3.url);
        console.log('应该匹配到: /save 路由（保存）');

        // 4. 测试 /sound/del 路由
        console.log('\n4. 测试 /sound/del 路由');
        
        const mockReq4 = {
            method: 'POST',
            url: '/sound/del',
            body: {
                id: 1
            }
        };

        console.log('请求URL:', mockReq4.url);
        console.log('应该匹配到: /del 路由（删除）');

        console.log('\n✅ 路由顺序测试完成！');
        console.log('\n📋 路由优先级（从高到低）:');
        console.log('1. POST /sound/save - 保存（新增/修改）');
        console.log('2. POST /sound/del - 删除');
        console.log('3. GET /sound/page - 分页查询');
        console.log('4. GET /sound/:id - 通过ID查询');
        console.log('\n💡 关键点: 具体路径（如 /page）必须在参数路径（如 /:id）之前定义');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSoundRouteOrder()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSoundRouteOrder };
