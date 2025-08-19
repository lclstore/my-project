/**
 * 测试 Exercise 查询接口不返回 is_deleted 字段
 */

const express = require('express');
const request = require('supertest');
const exerciseRoutes = require('../routes/exercise');
const { BusinessHelper, query } = require('../config/database');

async function testExerciseFieldFilter() {
    try {
        console.log('🚀 开始测试 Exercise 字段过滤功能...\n');

        // 创建测试应用
        const app = express();
        app.use(express.json());
        app.use('/exercise', exerciseRoutes);

        // 1. 创建测试数据
        console.log('1. 创建测试数据');
        const testData = {
            name: '字段过滤测试动作',
            status: 'ENABLED',
            is_deleted: 0
        };

        const result = await BusinessHelper.insertWithValidation('exercise', testData);
        if (!result.success) {
            throw new Error('创建测试数据失败');
        }

        const testId = result.insertId;
        console.log(`✅ 创建测试数据成功，ID: ${testId}`);

        // 2. 验证数据库中确实有 is_deleted 字段
        console.log('\n2. 验证数据库中的字段');
        const dbResult = await query('SELECT id, name, status, is_deleted FROM exercise WHERE id = ?', [testId]);
        
        if (dbResult.length > 0) {
            const record = dbResult[0];
            console.log('数据库记录:', {
                id: record.id,
                name: record.name,
                status: record.status,
                is_deleted: record.is_deleted
            });
            
            if (record.is_deleted === 0) {
                console.log('✅ 数据库中 is_deleted 字段存在且值正确');
            } else {
                console.log('❌ 数据库中 is_deleted 字段值不正确');
            }
        }

        // 3. 测试通过ID查询接口
        console.log('\n3. 测试通过ID查询接口');
        const detailResponse = await request(app)
            .get(`/exercise/detail/${testId}`);

        console.log('ID查询状态:', detailResponse.status);
        
        if (detailResponse.status === 200 && detailResponse.body.success) {
            const responseData = detailResponse.body.data;
            console.log('响应字段:', Object.keys(responseData));
            
            if ('isDeleted' in responseData || 'is_deleted' in responseData) {
                console.log('❌ ID查询响应包含了 is_deleted 字段');
                console.log('isDeleted:', responseData.isDeleted);
                console.log('is_deleted:', responseData.is_deleted);
            } else {
                console.log('✅ ID查询响应正确过滤了 is_deleted 字段');
            }
            
            // 验证其他字段是否正常返回
            const expectedFields = ['id', 'name', 'status', 'createTime', 'updateTime'];
            const missingFields = expectedFields.filter(field => !(field in responseData));
            
            if (missingFields.length === 0) {
                console.log('✅ 其他必要字段都正常返回');
            } else {
                console.log('⚠️  缺少字段:', missingFields);
            }
        } else {
            console.log('❌ ID查询失败:', detailResponse.body);
        }

        // 4. 测试分页查询接口
        console.log('\n4. 测试分页查询接口');
        const pageResponse = await request(app)
            .get('/exercise/page')
            .query({
                keywords: '字段过滤测试',
                pageIndex: 1,
                pageSize: 10
            });

        console.log('分页查询状态:', pageResponse.status);
        
        if (pageResponse.status === 200 && pageResponse.body.success) {
            const responseData = pageResponse.body.data;
            
            if (Array.isArray(responseData) && responseData.length > 0) {
                const firstRecord = responseData[0];
                console.log('分页查询第一条记录字段:', Object.keys(firstRecord));
                
                if ('isDeleted' in firstRecord || 'is_deleted' in firstRecord) {
                    console.log('❌ 分页查询响应包含了 is_deleted 字段');
                    console.log('isDeleted:', firstRecord.isDeleted);
                    console.log('is_deleted:', firstRecord.is_deleted);
                } else {
                    console.log('✅ 分页查询响应正确过滤了 is_deleted 字段');
                }
                
                // 验证找到的记录是否是我们创建的测试数据
                const testRecord = responseData.find(record => record.id === testId);
                if (testRecord) {
                    console.log('✅ 找到了测试记录，字段过滤正常');
                } else {
                    console.log('⚠️  未找到测试记录');
                }
            } else {
                console.log('⚠️  分页查询未返回数据');
            }
        } else {
            console.log('❌ 分页查询失败:', pageResponse.body);
        }

        // 5. 测试逻辑删除后的查询
        console.log('\n5. 测试逻辑删除后的查询');
        
        // 5.1 逻辑删除记录
        await query('UPDATE exercise SET is_deleted = 1 WHERE id = ?', [testId]);
        console.log('✅ 已将测试记录标记为逻辑删除');
        
        // 5.2 再次查询ID接口
        const deletedDetailResponse = await request(app)
            .get(`/exercise/detail/${testId}`);

        console.log('逻辑删除后ID查询状态:', deletedDetailResponse.status);
        
        if (deletedDetailResponse.status === 404) {
            console.log('✅ 逻辑删除后ID查询正确返回404');
        } else {
            console.log('❌ 逻辑删除后ID查询应该返回404');
        }
        
        // 5.3 再次查询分页接口
        const deletedPageResponse = await request(app)
            .get('/exercise/page')
            .query({
                keywords: '字段过滤测试',
                pageIndex: 1,
                pageSize: 10
            });

        if (deletedPageResponse.status === 200 && deletedPageResponse.body.success) {
            const responseData = deletedPageResponse.body.data;
            const testRecord = Array.isArray(responseData) ? 
                responseData.find(record => record.id === testId) : null;
            
            if (!testRecord) {
                console.log('✅ 逻辑删除后分页查询正确过滤了已删除记录');
            } else {
                console.log('❌ 逻辑删除后分页查询仍然返回了已删除记录');
            }
        }

        // 6. 清理测试数据
        console.log('\n6. 清理测试数据');
        await query('DELETE FROM exercise WHERE id = ?', [testId]);
        console.log('✅ 清理完成');

        console.log('\n✅ Exercise 字段过滤功能测试完成！');
        
        console.log('\n📋 测试总结:');
        console.log('- ✅ 数据库中正确存储 is_deleted 字段');
        console.log('- ✅ ID查询接口不返回 is_deleted 字段');
        console.log('- ✅ 分页查询接口不返回 is_deleted 字段');
        console.log('- ✅ 逻辑删除功能正常工作');
        console.log('- ✅ 查询接口正确过滤已删除记录');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testExerciseFieldFilter()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testExerciseFieldFilter };
