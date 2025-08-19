/**
 * 测试 Exercise 分页查询接口
 */

const express = require('express');
const request = require('supertest');
const exerciseRoutes = require('../routes/exercise');
const { BusinessHelper, query } = require('../config/database');

async function testExercisePage() {
    try {
        console.log('🚀 开始测试 Exercise 分页查询接口...\n');

        // 创建测试应用
        const app = express();
        app.use(express.json());
        app.use('/exercise', exerciseRoutes);

        // 1. 创建一些测试数据
        console.log('1. 创建测试数据');
        const testData = [
            {
                name: '测试动作1',
                status: 'ENABLED'
            },
            {
                name: '测试动作2',
                status: 'DRAFT'
            },
            {
                name: '测试动作3',
                status: 'DISABLED'
            }
        ];

        const createdIds = [];
        for (const data of testData) {
            const result = await BusinessHelper.insertWithValidation('exercise', data);
            if (result.success) {
                createdIds.push(result.insertId);
                console.log(`✅ 创建测试数据成功，ID: ${result.insertId}, 名称: "${data.name}"`);
            }
        }

        // 2. 测试基本分页查询
        console.log('\n2. 测试基本分页查询');
        const basicResponse = await request(app)
            .get('/exercise/page')
            .query({
                pageIndex: 1,
                pageSize: 10
            });

        console.log('基本分页查询状态:', basicResponse.status);
        console.log('基本分页查询响应:', JSON.stringify(basicResponse.body, null, 2));

        // 3. 测试状态筛选
        console.log('\n3. 测试状态筛选');
        const statusResponse = await request(app)
            .get('/exercise/page')
            .query({
                statusList: 'ENABLED,DRAFT',
                pageIndex: 1,
                pageSize: 10
            });

        console.log('状态筛选查询状态:', statusResponse.status);
        console.log('状态筛选查询响应:', JSON.stringify(statusResponse.body, null, 2));

        // 4. 测试关键词搜索
        console.log('\n4. 测试关键词搜索');
        const keywordResponse = await request(app)
            .get('/exercise/page')
            .query({
                keywords: '测试动作',
                pageIndex: 1,
                pageSize: 10
            });

        console.log('关键词搜索状态:', keywordResponse.status);
        console.log('关键词搜索响应:', JSON.stringify(keywordResponse.body, null, 2));

        // 5. 测试ID搜索
        if (createdIds.length > 0) {
            console.log('\n5. 测试ID搜索');
            const idResponse = await request(app)
                .get('/exercise/page')
                .query({
                    keywords: createdIds[0].toString(),
                    pageIndex: 1,
                    pageSize: 10
                });

            console.log('ID搜索状态:', idResponse.status);
            console.log('ID搜索响应:', JSON.stringify(idResponse.body, null, 2));
        }

        // 6. 测试多条件筛选
        console.log('\n6. 测试多条件筛选');
        const multiFilterResponse = await request(app)
            .get('/exercise/page')
            .query({
                statusList: 'ENABLED,DISABLED',
                structureTypeCodeList: 'MAIN,WARM_UP',
                genderCodeList: 'FEMALE,MALE',
                pageIndex: 1,
                pageSize: 10
            });

        console.log('多条件筛选状态:', multiFilterResponse.status);
        console.log('多条件筛选响应:', JSON.stringify(multiFilterResponse.body, null, 2));

        // 7. 清理测试数据
        console.log('\n7. 清理测试数据');
        if (createdIds.length > 0) {
            const deleteResult = await query(
                `DELETE FROM exercise WHERE id IN (${createdIds.map(() => '?').join(',')})`,
                createdIds
            );
            console.log(`✅ 清理完成，删除 ${deleteResult.affectedRows} 条记录`);
        }

        console.log('\n✅ Exercise 分页查询接口测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testExercisePage()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testExercisePage };
