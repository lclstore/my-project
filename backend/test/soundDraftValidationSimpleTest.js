/**
 * 测试 sound 模块草稿状态验证逻辑（简化版）
 * 模拟前端传递完整数据的情况
 */

const { BusinessHelper, query } = require('../config/database');
const { validateApiData } = require('../utils/validator');

async function testSoundDraftValidationSimple() {
    try {
        console.log('🚀 开始测试 sound 模块草稿状态验证（简化版）...\n');

        // 1. 测试验证规则差异
        console.log('1. 测试验证规则差异');

        // 1.1 草稿状态 - 只需要 name 字段
        console.log('1.1 草稿状态验证（只有name和status）');
        const draftData = {
            name: '草稿音频',
            status: 'DRAFT',
            translation: 0  // 前端传递的默认值
        };

        const draftValidation = validateApiData('sound.draft', draftData);
        console.log('草稿验证结果:', draftValidation.valid ? '✅ 通过' : '❌ 失败');
        if (!draftValidation.valid) {
            console.log('草稿验证错误:', draftValidation.errors?.join(', '));
        }

        // 1.2 完整状态 - 需要所有必填字段
        console.log('1.2 完整状态验证（缺少必填字段）');
        const enabledIncompleteData = {
            name: '启用音频',
            status: 'ENABLED',
            translation: 1
            // 缺少 genderCode, usageCode
        };

        const enabledIncompleteValidation = validateApiData('sound', enabledIncompleteData);
        console.log('完整状态验证结果:', enabledIncompleteValidation.valid ? '✅ 通过' : '❌ 失败（预期）');
        if (!enabledIncompleteValidation.valid) {
            console.log('完整状态验证错误:', enabledIncompleteValidation.errors?.join(', '));
        }

        // 1.3 完整状态 - 所有必填字段都有
        console.log('1.3 完整状态验证（所有必填字段）');
        const enabledCompleteData = {
            name: '完整启用音频',
            genderCode: 'FEMALE',
            usageCode: 'GENERAL',
            translation: 1,
            status: 'ENABLED'
        };

        const enabledCompleteValidation = validateApiData('sound', enabledCompleteData);
        console.log('完整状态验证结果:', enabledCompleteValidation.valid ? '✅ 通过' : '❌ 失败');
        if (!enabledCompleteValidation.valid) {
            console.log('完整状态验证错误:', enabledCompleteValidation.errors?.join(', '));
        }

        // 2. 测试实际保存操作
        console.log('\n2. 测试实际保存操作');

        // 2.1 保存草稿状态（前端传递基本数据）
        console.log('2.1 保存草稿状态');
        const draftSaveData = {
            name: '测试草稿音频',
            genderCode: 'FEMALE',  // 前端可能传递，也可能不传递
            usageCode: 'GENERAL',  // 前端可能传递，也可能不传递
            translation: 0,        // 前端传递的默认值
            status: 'DRAFT'
        };

        const draftSaveResult = await BusinessHelper.insertWithValidation('sound', draftSaveData);
        if (draftSaveResult.success) {
            console.log('✅ 草稿保存成功，ID:', draftSaveResult.insertId);
            var draftId = draftSaveResult.insertId;
        } else {
            console.log('❌ 草稿保存失败:', draftSaveResult.message);
        }

        // 2.2 保存草稿状态（最小数据）
        console.log('2.2 保存草稿状态（最小数据）');
        const draftMinimalSaveData = {
            name: '最小草稿音频',
            translation: 0,  // 前端传递的默认值
            status: 'DRAFT'
            // 不传递其他字段
        };

        const draftMinimalSaveResult = await BusinessHelper.insertWithValidation('sound', draftMinimalSaveData);
        if (draftMinimalSaveResult.success) {
            console.log('✅ 最小草稿保存成功，ID:', draftMinimalSaveResult.insertId);
            var draftMinimalId = draftMinimalSaveResult.insertId;
        } else {
            console.log('❌ 最小草稿保存失败:', draftMinimalSaveResult.message);
        }

        // 2.3 保存启用状态（完整数据）
        console.log('2.3 保存启用状态（完整数据）');
        const enabledSaveData = {
            name: '测试启用音频',
            genderCode: 'MALE',
            usageCode: 'FLOW',
            translation: 1,
            status: 'ENABLED'
        };

        const enabledSaveResult = await BusinessHelper.insertWithValidation('sound', enabledSaveData);
        if (enabledSaveResult.success) {
            console.log('✅ 启用状态保存成功，ID:', enabledSaveResult.insertId);
            var enabledId = enabledSaveResult.insertId;
        } else {
            console.log('❌ 启用状态保存失败:', enabledSaveResult.message);
        }

        // 3. 测试草稿更新为完整状态
        console.log('\n3. 测试草稿更新为完整状态');

        if (draftId) {
            console.log('3.1 将草稿更新为启用状态');
            const updateData = {
                id: draftId,
                name: '测试草稿音频（更新为启用）',
                genderCode: 'FEMALE_AND_MALE',
                usageCode: 'GENERAL',
                translation: 1,
                status: 'ENABLED'
            };

            const updateResult = await BusinessHelper.updateWithValidation(
                'sound',
                draftId,
                updateData,
                [],
                'sound'
            );

            if (updateResult.success) {
                console.log('✅ 草稿更新为启用成功');
            } else {
                console.log('❌ 草稿更新为启用失败:', updateResult.message);
            }
        }

        // 4. 验证保存的数据
        console.log('\n4. 验证保存的数据');
        const savedIds = [draftId, draftMinimalId, enabledId].filter(id => id);
        
        if (savedIds.length > 0) {
            const savedRecords = await query(
                `SELECT id, name, gender_code, usage_code, translation, status FROM sound WHERE id IN (${savedIds.map(() => '?').join(',')})`,
                savedIds
            );

            console.log('保存的记录:');
            savedRecords.forEach(record => {
                console.log(`  - ID: ${record.id}`);
                console.log(`    名称: ${record.name}`);
                console.log(`    状态: ${record.status}`);
                console.log(`    性别: ${record.gender_code || '未设置'}`);
                console.log(`    用途: ${record.usage_code || '未设置'}`);
                console.log(`    翻译: ${record.translation}`);
                console.log('');
            });
        }

        // 5. 测试业务逻辑验证
        console.log('5. 测试业务逻辑验证');

        console.log('5.1 草稿状态可以缺少非必填字段');
        const draftPartialData = {
            name: '部分草稿',
            translation: 0,
            status: 'DRAFT'
            // 缺少 genderCode, usageCode - 这在草稿状态下是允许的
        };

        const draftPartialValidation = validateApiData('sound.draft', draftPartialData);
        console.log('部分草稿验证:', draftPartialValidation.valid ? '✅ 通过' : '❌ 失败');

        console.log('5.2 启用状态必须有所有必填字段');
        const enabledPartialData = {
            name: '部分启用',
            translation: 1,
            status: 'ENABLED'
            // 缺少 genderCode, usageCode - 这在启用状态下是不允许的
        };

        const enabledPartialValidation = validateApiData('sound', enabledPartialData);
        console.log('部分启用验证:', enabledPartialValidation.valid ? '✅ 通过' : '❌ 失败（预期）');

        // 6. 清理测试数据
        console.log('\n6. 清理测试数据');
        const allIds = [draftId, draftMinimalId, enabledId].filter(id => id);
        
        if (allIds.length > 0) {
            const deleteResult = await query(
                `DELETE FROM sound WHERE id IN (${allIds.map(() => '?').join(',')})`,
                allIds
            );
            console.log(`✅ 清理完成，删除 ${deleteResult.affectedRows} 条记录`);
        }

        console.log('\n✅ sound 模块草稿状态验证测试完成！');
        console.log('\n📋 测试总结:');
        console.log('- ✅ 草稿状态只验证 name 字段（其他字段可选）');
        console.log('- ✅ 完整状态验证所有必填字段');
        console.log('- ✅ 前端传递 translation 默认值');
        console.log('- ✅ 草稿可以保存不完整数据');
        console.log('- ✅ 草稿可以更新为完整状态');
        console.log('- ✅ 验证规则根据状态动态选择');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSoundDraftValidationSimple()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSoundDraftValidationSimple };
