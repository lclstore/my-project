/**
 * 测试 Exercise 批量操作接口和逻辑删除功能
 */

const express = require('express');
const request = require('supertest');
const exerciseRoutes = require('../routes/exercise');
const { BusinessHelper, query } = require('../config/database');

async function testExerciseBatchOperations() {
    try {
        console.log('🚀 开始测试 Exercise 批量操作和逻辑删除功能...\n');

        // 创建测试应用
        const app = express();
        app.use(express.json());
        app.use('/exercise', exerciseRoutes);

        // 1. 创建测试数据
        console.log('1. 创建测试数据');
        const testData = [
            { name: '批量测试动作1', status: 'DRAFT' },
            { name: '批量测试动作2', status: 'ENABLED' },
            { name: '批量测试动作3', status: 'DISABLED' },
            { name: '批量测试动作4', status: 'ENABLED' },
            { name: '批量测试动作5', status: 'DRAFT' }
        ];

        const createdIds = [];
        for (const data of testData) {
            const result = await BusinessHelper.insertWithValidation('exercise', {
                ...data,
                is_deleted: 0
            });
            if (result.success) {
                createdIds.push(result.insertId);
                console.log(`✅ 创建测试数据成功，ID: ${result.insertId}, 名称: "${data.name}"`);
            }
        }

        // 2. 验证 is_deleted 默认值
        console.log('\n2. 验证 is_deleted 默认值');
        const checkSql = 'SELECT id, name, is_deleted FROM exercise WHERE id IN (' + createdIds.map(() => '?').join(',') + ')';
        const checkResult = await query(checkSql, createdIds);
        
        checkResult.forEach(record => {
            if (record.is_deleted === 0) {
                console.log(`✅ ID ${record.id} 的 is_deleted 默认值正确: ${record.is_deleted}`);
            } else {
                console.log(`❌ ID ${record.id} 的 is_deleted 默认值错误: ${record.is_deleted}`);
            }
        });

        // 3. 测试名称重复检查（只检查未删除的记录）
        console.log('\n3. 测试名称重复检查');
        
        // 3.1 先逻辑删除一个记录
        await query('UPDATE exercise SET is_deleted = 1 WHERE id = ?', [createdIds[0]]);
        console.log(`✅ 逻辑删除了 ID ${createdIds[0]} 的记录`);
        
        // 3.2 尝试创建与已删除记录同名的新记录（应该成功）
        const duplicateNameResponse = await request(app)
            .post('/exercise/save')
            .send({
                name: '批量测试动作1', // 与已删除记录同名
                status: 'DRAFT'
            });

        console.log('重复名称测试状态:', duplicateNameResponse.status);
        if (duplicateNameResponse.body.success) {
            console.log('✅ 允许创建与已删除记录同名的新记录');
            createdIds.push(duplicateNameResponse.body.data.id);
        } else {
            console.log('❌ 不允许创建与已删除记录同名的新记录:', duplicateNameResponse.body.errMessage);
        }

        // 4. 测试批量启用接口
        console.log('\n4. 测试批量启用接口');
        const enableIds = createdIds.slice(1, 4); // 选择3个ID进行启用
        const enableResponse = await request(app)
            .post('/exercise/enable')
            .send({
                idList: enableIds
            });

        console.log('批量启用状态:', enableResponse.status);
        console.log('批量启用响应:', JSON.stringify(enableResponse.body, null, 2));

        if (enableResponse.body.success) {
            console.log(`✅ 批量启用成功，成功数量: ${enableResponse.body.data.successCount}`);
        }

        // 5. 测试批量禁用接口
        console.log('\n5. 测试批量禁用接口');
        const disableIds = createdIds.slice(2, 5); // 选择3个ID进行禁用
        const disableResponse = await request(app)
            .post('/exercise/disable')
            .send({
                idList: disableIds
            });

        console.log('批量禁用状态:', disableResponse.status);
        console.log('批量禁用响应:', JSON.stringify(disableResponse.body, null, 2));

        if (disableResponse.body.success) {
            console.log(`✅ 批量禁用成功，成功数量: ${disableResponse.body.data.successCount}`);
        }

        // 6. 测试批量删除接口
        console.log('\n6. 测试批量删除接口');
        const deleteIds = createdIds.slice(0, 3); // 选择3个ID进行删除
        const deleteResponse = await request(app)
            .post('/exercise/del')
            .send({
                idList: deleteIds
            });

        console.log('批量删除状态:', deleteResponse.status);
        console.log('批量删除响应:', JSON.stringify(deleteResponse.body, null, 2));

        if (deleteResponse.body.success) {
            console.log(`✅ 批量删除成功，成功数量: ${deleteResponse.body.data.successCount}`);
        }

        // 7. 验证逻辑删除效果
        console.log('\n7. 验证逻辑删除效果');
        const deletedCheckSql = 'SELECT id, name, is_deleted FROM exercise WHERE id IN (' + deleteIds.map(() => '?').join(',') + ')';
        const deletedCheckResult = await query(deletedCheckSql, deleteIds);
        
        deletedCheckResult.forEach(record => {
            if (record.is_deleted === 1) {
                console.log(`✅ ID ${record.id} 已被逻辑删除: is_deleted = ${record.is_deleted}`);
            } else {
                console.log(`❌ ID ${record.id} 逻辑删除失败: is_deleted = ${record.is_deleted}`);
            }
        });

        // 8. 测试查询接口是否过滤已删除记录
        console.log('\n8. 测试查询接口是否过滤已删除记录');
        
        // 8.1 测试分页查询
        const pageResponse = await request(app)
            .get('/exercise/page')
            .query({
                keywords: '批量测试动作',
                pageIndex: 1,
                pageSize: 10
            });

        console.log('分页查询状态:', pageResponse.status);
        if (pageResponse.body.success) {
            const foundIds = pageResponse.body.data.map(item => item.id);
            const deletedInResults = foundIds.filter(id => deleteIds.includes(id));
            
            if (deletedInResults.length === 0) {
                console.log('✅ 分页查询正确过滤了已删除记录');
            } else {
                console.log('❌ 分页查询包含了已删除记录:', deletedInResults);
            }
            
            console.log(`查询到 ${pageResponse.body.data.length} 条未删除记录`);
        }

        // 8.2 测试ID查询
        if (deleteIds.length > 0) {
            const detailResponse = await request(app)
                .get(`/exercise/detail/${deleteIds[0]}`);

            console.log('ID查询已删除记录状态:', detailResponse.status);
            if (detailResponse.status === 404) {
                console.log('✅ ID查询正确拒绝了已删除记录');
            } else {
                console.log('❌ ID查询返回了已删除记录');
            }
        }

        // 9. 测试参数验证
        console.log('\n9. 测试参数验证');
        
        // 9.1 测试空数组
        const emptyArrayResponse = await request(app)
            .post('/exercise/enable')
            .send({
                idList: []
            });

        if (emptyArrayResponse.status === 400) {
            console.log('✅ 空数组参数验证正确');
        } else {
            console.log('❌ 空数组参数验证失败');
        }

        // 9.2 测试无效ID
        const invalidIdResponse = await request(app)
            .post('/exercise/enable')
            .send({
                idList: [-1, 0, 'invalid']
            });

        if (invalidIdResponse.status === 400) {
            console.log('✅ 无效ID参数验证正确');
        } else {
            console.log('❌ 无效ID参数验证失败');
        }

        // 10. 清理测试数据
        console.log('\n10. 清理测试数据');
        if (createdIds.length > 0) {
            const cleanupSql = `DELETE FROM exercise WHERE id IN (${createdIds.map(() => '?').join(',')})`;
            const cleanupResult = await query(cleanupSql, createdIds);
            console.log(`✅ 清理完成，删除 ${cleanupResult.affectedRows} 条记录`);
        }

        console.log('\n✅ Exercise 批量操作和逻辑删除功能测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testExerciseBatchOperations()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testExerciseBatchOperations };
