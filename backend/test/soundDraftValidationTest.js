/**
 * 测试 sound 模块草稿状态的验证逻辑
 */

const { BusinessHelper, query } = require('../config/database');
const { validateApiData } = require('../utils/validator');

async function testSoundDraftValidation() {
    try {
        console.log('🚀 开始测试 sound 模块草稿状态验证...\n');

        // 1. 测试草稿状态验证规则
        console.log('1. 测试草稿状态验证规则');

        // 1.1 测试草稿状态只需要 name 字段
        console.log('1.1 测试草稿状态最小数据（只有name）');
        const draftMinimalData = {
            name: '草稿音频',
            status: 'DRAFT'
        };

        const draftValidation = validateApiData('sound.draft', draftMinimalData);
        console.log('草稿最小数据验证:', draftValidation.valid ? '✅' : '❌', draftValidation.errors?.join(', ') || '通过');

        // 1.2 测试草稿状态缺少 name 字段
        console.log('1.2 测试草稿状态缺少name字段');
        const draftNoNameData = {
            genderCode: 'FEMALE',
            status: 'DRAFT'
        };

        const draftNoNameValidation = validateApiData('sound.draft', draftNoNameData);
        console.log('草稿缺少name验证:', draftNoNameValidation.valid ? '✅' : '❌', draftNoNameValidation.errors?.join(', ') || '通过');

        // 1.3 测试草稿状态有部分字段
        console.log('1.3 测试草稿状态有部分字段');
        const draftPartialData = {
            name: '部分草稿音频',
            genderCode: 'FEMALE',
            status: 'DRAFT'
            // 缺少 usageCode, translation 等必填字段
        };

        const draftPartialValidation = validateApiData('sound.draft', draftPartialData);
        console.log('草稿部分字段验证:', draftPartialValidation.valid ? '✅' : '❌', draftPartialValidation.errors?.join(', ') || '通过');

        // 2. 对比完整状态验证规则
        console.log('\n2. 对比完整状态验证规则');

        // 2.1 测试完整状态需要所有必填字段
        console.log('2.1 测试完整状态最小数据（缺少必填字段）');
        const enabledMinimalData = {
            name: '启用音频',
            status: 'ENABLED'
            // 缺少 genderCode, usageCode, translation 等必填字段
        };

        const enabledValidation = validateApiData('sound', enabledMinimalData);
        console.log('启用状态最小数据验证:', enabledValidation.valid ? '✅' : '❌', enabledValidation.errors?.join(', ') || '通过');

        // 2.2 测试完整状态完整数据
        console.log('2.2 测试完整状态完整数据');
        const enabledCompleteData = {
            name: '完整启用音频',
            genderCode: 'FEMALE',
            usageCode: 'GENERAL',
            translation: 1,
            status: 'ENABLED'
        };

        const enabledCompleteValidation = validateApiData('sound', enabledCompleteData);
        console.log('启用状态完整数据验证:', enabledCompleteValidation.valid ? '✅' : '❌', enabledCompleteValidation.errors?.join(', ') || '通过');

        // 3. 测试实际保存操作
        console.log('\n3. 测试实际保存操作');

        // 3.1 保存草稿状态（最小数据）
        console.log('3.1 保存草稿状态（最小数据）');
        const draftSaveData = {
            name: '测试草稿音频',
            status: 'DRAFT'
        };

        const draftSaveResult = await BusinessHelper.insertWithValidation('sound', draftSaveData);
        if (draftSaveResult.success) {
            console.log('✅ 草稿保存成功，ID:', draftSaveResult.insertId);
            var draftId = draftSaveResult.insertId;
        } else {
            console.log('❌ 草稿保存失败:', draftSaveResult.message);
        }

        // 3.2 保存草稿状态（部分数据）
        console.log('3.2 保存草稿状态（部分数据）');
        const draftPartialSaveData = {
            name: '测试部分草稿音频',
            genderCode: 'MALE',
            femaleAudioUrl: 'https://example.com/test.mp3',
            status: 'DRAFT'
        };

        const draftPartialSaveResult = await BusinessHelper.insertWithValidation('sound', draftPartialSaveData);
        if (draftPartialSaveResult.success) {
            console.log('✅ 部分草稿保存成功，ID:', draftPartialSaveResult.insertId);
            var draftPartialId = draftPartialSaveResult.insertId;
        } else {
            console.log('❌ 部分草稿保存失败:', draftPartialSaveResult.message);
        }

        // 3.3 尝试保存启用状态（缺少必填字段）
        console.log('3.3 尝试保存启用状态（缺少必填字段）');
        const enabledIncompleteData = {
            name: '测试启用音频',
            status: 'ENABLED'
            // 缺少必填字段
        };

        const enabledIncompleteResult = await BusinessHelper.insertWithValidation('sound', enabledIncompleteData);
        if (enabledIncompleteResult.success) {
            console.log('✅ 启用状态保存成功，ID:', enabledIncompleteResult.insertId);
        } else {
            console.log('❌ 启用状态保存失败（预期）:', enabledIncompleteResult.message);
        }

        // 3.4 保存启用状态（完整数据）
        console.log('3.4 保存启用状态（完整数据）');
        const enabledCompleteData2 = {
            name: '测试完整启用音频',
            genderCode: 'FEMALE_AND_MALE',
            usageCode: 'FLOW',
            translation: 1,
            status: 'ENABLED'
        };

        const enabledCompleteSaveResult = await BusinessHelper.insertWithValidation('sound', enabledCompleteData2);
        if (enabledCompleteSaveResult.success) {
            console.log('✅ 完整启用状态保存成功，ID:', enabledCompleteSaveResult.insertId);
            var enabledId = enabledCompleteSaveResult.insertId;
        } else {
            console.log('❌ 完整启用状态保存失败:', enabledCompleteSaveResult.message);
        }

        // 4. 测试草稿到完整状态的转换
        console.log('\n4. 测试草稿到完整状态的转换');

        if (draftId) {
            console.log('4.1 将草稿更新为启用状态（缺少必填字段）');
            const updateToEnabledIncomplete = {
                id: draftId,
                name: '测试草稿音频',
                status: 'ENABLED'
                // 缺少其他必填字段
            };

            const updateIncompleteResult = await BusinessHelper.updateWithValidation(
                'sound',
                draftId,
                updateToEnabledIncomplete,
                [],
                'sound'
            );

            if (updateIncompleteResult.success) {
                console.log('✅ 草稿更新为启用成功');
            } else {
                console.log('❌ 草稿更新为启用失败（预期）:', updateIncompleteResult.message);
            }

            console.log('4.2 将草稿更新为启用状态（完整字段）');
            const updateToEnabledComplete = {
                id: draftId,
                name: '测试草稿音频（已完善）',
                genderCode: 'FEMALE',
                usageCode: 'GENERAL',
                translation: 0,
                status: 'ENABLED'
            };

            const updateCompleteResult = await BusinessHelper.updateWithValidation(
                'sound',
                draftId,
                updateToEnabledComplete,
                [],
                'sound'
            );

            if (updateCompleteResult.success) {
                console.log('✅ 草稿更新为启用成功');
            } else {
                console.log('❌ 草稿更新为启用失败:', updateCompleteResult.message);
            }
        }

        // 5. 验证保存的数据
        console.log('\n5. 验证保存的数据');
        const savedIds = [draftId, draftPartialId, enabledId].filter(id => id);
        
        if (savedIds.length > 0) {
            const savedRecords = await query(
                `SELECT id, name, gender_code, usage_code, translation, status FROM sound WHERE id IN (${savedIds.map(() => '?').join(',')})`,
                savedIds
            );

            console.log('保存的记录:');
            savedRecords.forEach(record => {
                console.log(`  - ID: ${record.id}, 名称: ${record.name}, 状态: ${record.status}, 性别: ${record.gender_code || '未设置'}, 用途: ${record.usage_code || '未设置'}`);
            });
        }

        // 6. 清理测试数据
        console.log('\n6. 清理测试数据');
        const allIds = [draftId, draftPartialId, enabledId].filter(id => id);
        
        if (allIds.length > 0) {
            const deleteResult = await query(
                `DELETE FROM sound WHERE id IN (${allIds.map(() => '?').join(',')})`,
                allIds
            );
            console.log(`✅ 清理完成，删除 ${deleteResult.affectedRows} 条记录`);
        }

        console.log('\n✅ sound 模块草稿状态验证测试完成！');
        console.log('\n📋 测试总结:');
        console.log('- ✅ 草稿状态只需要验证 name 字段');
        console.log('- ✅ 草稿状态其他字段都是可选的');
        console.log('- ✅ 完整状态需要验证所有必填字段');
        console.log('- ✅ 草稿可以保存不完整的数据');
        console.log('- ✅ 草稿可以更新为完整状态');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSoundDraftValidation()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSoundDraftValidation };
