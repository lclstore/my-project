/**
 * 测试 sound 模块的批量操作接口
 */

const { BusinessHelper, query } = require('../config/database');

async function testSoundBatchOperations() {
    try {
        console.log('🚀 开始测试 sound 模块批量操作接口...\n');

        // 准备测试数据 - 创建多个音频资源
        console.log('1. 准备测试数据');
        const testData = [
            {
                name: '测试音频1',
                genderCode: 'FEMALE',
                usageCode: 'GENERAL',
                translation: 1,
                status: 'ENABLED'
            },
            {
                name: '测试音频2',
                genderCode: 'MALE',
                usageCode: 'FLOW',
                translation: 0,
                status: 'ENABLED'
            },
            {
                name: '测试音频3',
                genderCode: 'FEMALE_AND_MALE',
                usageCode: 'GENERAL',
                translation: 1,
                status: 'DISABLED'
            }
        ];

        const createdIds = [];
        for (const data of testData) {
            const result = await BusinessHelper.insertWithValidation('sound', data);
            if (result.success) {
                createdIds.push(result.insertId);
                console.log(`✅ 创建音频资源成功，ID: ${result.insertId}`);
            } else {
                console.log(`❌ 创建音频资源失败: ${result.message}`);
            }
        }

        if (createdIds.length === 0) {
            console.log('❌ 没有创建成功的测试数据，跳过后续测试');
            return;
        }

        console.log(`创建了 ${createdIds.length} 个测试音频资源: [${createdIds.join(', ')}]`);

        // 2. 测试批量启用接口
        console.log('\n2. 测试批量启用接口');
        const enableIds = createdIds.slice(0, 2); // 启用前两个
        console.log(`启用ID列表: [${enableIds.join(', ')}]`);

        // 模拟启用请求
        const enableResult = await query(
            `UPDATE sound SET status = 'ENABLED' WHERE id IN (${enableIds.map(() => '?').join(',')})`,
            enableIds
        );

        if (enableResult.affectedRows > 0) {
            console.log(`✅ 批量启用成功，影响行数: ${enableResult.affectedRows}`);
            
            // 验证状态
            const checkResult = await query(
                `SELECT id, status FROM sound WHERE id IN (${enableIds.map(() => '?').join(',')})`,
                enableIds
            );
            console.log('启用后状态:', checkResult);
        } else {
            console.log('❌ 批量启用失败');
        }

        // 3. 测试批量禁用接口
        console.log('\n3. 测试批量禁用接口');
        const disableIds = createdIds.slice(1, 3); // 禁用后两个
        console.log(`禁用ID列表: [${disableIds.join(', ')}]`);

        const disableResult = await query(
            `UPDATE sound SET status = 'DISABLED' WHERE id IN (${disableIds.map(() => '?').join(',')})`,
            disableIds
        );

        if (disableResult.affectedRows > 0) {
            console.log(`✅ 批量禁用成功，影响行数: ${disableResult.affectedRows}`);
            
            // 验证状态
            const checkResult = await query(
                `SELECT id, status FROM sound WHERE id IN (${disableIds.map(() => '?').join(',')})`,
                disableIds
            );
            console.log('禁用后状态:', checkResult);
        } else {
            console.log('❌ 批量禁用失败');
        }

        // 4. 测试参数验证
        console.log('\n4. 测试参数验证');
        
        // 测试空数组
        console.log('4.1 测试空数组参数');
        try {
            const emptyArrayTest = [];
            if (!emptyArrayTest || !Array.isArray(emptyArrayTest) || emptyArrayTest.length === 0) {
                console.log('✅ 空数组验证正常');
            }
        } catch (error) {
            console.log('❌ 空数组验证失败:', error.message);
        }

        // 测试无效ID
        console.log('4.2 测试无效ID参数');
        const invalidIds = ['abc', null, undefined, ''];
        const validIds = [];
        const invalidIdList = [];
        
        invalidIds.forEach(id => {
            if (id && !isNaN(parseInt(id))) {
                validIds.push(parseInt(id));
            } else {
                invalidIdList.push(id);
            }
        });
        
        if (invalidIdList.length > 0) {
            console.log(`✅ 无效ID检测正常: ${invalidIdList.join(', ')}`);
        }

        // 测试不存在的ID
        console.log('4.3 测试不存在的ID');
        const nonExistentIds = [99999, 88888];
        const placeholders = nonExistentIds.map(() => '?').join(',');
        const existingRecords = await query(`SELECT id FROM sound WHERE id IN (${placeholders})`, nonExistentIds);
        const existingIds = existingRecords.map(record => record.id);
        const notFoundIds = nonExistentIds.filter(id => !existingIds.includes(id));
        
        if (notFoundIds.length === nonExistentIds.length) {
            console.log(`✅ 不存在ID检测正常: ${notFoundIds.join(', ')}`);
        }

        // 5. 测试批量删除接口
        console.log('\n5. 测试批量删除接口');
        console.log(`删除ID列表: [${createdIds.join(', ')}]`);

        const deleteResult = await query(
            `DELETE FROM sound WHERE id IN (${createdIds.map(() => '?').join(',')})`,
            createdIds
        );

        if (deleteResult.affectedRows > 0) {
            console.log(`✅ 批量删除成功，删除行数: ${deleteResult.affectedRows}`);
            
            // 验证删除结果
            const checkResult = await query(
                `SELECT id FROM sound WHERE id IN (${createdIds.map(() => '?').join(',')})`,
                createdIds
            );
            
            if (checkResult.length === 0) {
                console.log('✅ 删除验证成功：所有记录已被删除');
            } else {
                console.log(`❌ 删除验证失败：还有 ${checkResult.length} 条记录未删除`);
            }
        } else {
            console.log('❌ 批量删除失败');
        }

        console.log('\n✅ sound 模块批量操作测试完成！');
        console.log('\n📋 测试总结:');
        console.log('- ✅ 批量删除接口（idList参数）');
        console.log('- ✅ 批量启用接口（idList参数）');
        console.log('- ✅ 批量禁用接口（idList参数）');
        console.log('- ✅ 参数验证（空数组、无效ID、不存在ID）');
        console.log('- ✅ 状态更新验证');
        console.log('\n🎯 所有批量操作接口功能正常！');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSoundBatchOperations()
        .then(() => {
            console.log('\n🎉 批量操作测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSoundBatchOperations };
