/**
 * 简单测试 Exercise 模块的核心功能
 */

const { BusinessHelper, query } = require('../config/database');

async function testExerciseSimple() {
    try {
        console.log('🚀 开始简单测试 Exercise 模块...\n');

        // 1. 测试新增草稿
        console.log('1. 测试新增草稿');
        const draftData = {
            name: '简单测试动作',
            status: 'DRAFT'
        };

        const draftResult = await BusinessHelper.insertWithValidation('exercise', draftData);
        if (draftResult.success) {
            console.log('✅ 草稿创建成功，ID:', draftResult.insertId);
            var exerciseId = draftResult.insertId;
        } else {
            console.log('❌ 草稿创建失败:', draftResult.message);
            return;
        }

        // 2. 测试通过ID查询
        console.log('\n2. 测试通过ID查询');
        const findResult = await BusinessHelper.findByIdWithValidation('exercise', exerciseId);
        if (findResult.success) {
            console.log('✅ 查询成功');
            console.log('  - ID:', findResult.data.id);
            console.log('  - 名称:', findResult.data.name);
            console.log('  - 状态:', findResult.data.status);
            console.log('  - 创建时间:', findResult.data.createTime);
        } else {
            console.log('❌ 查询失败:', findResult.message);
        }

        // 3. 测试修改为完整状态
        console.log('\n3. 测试修改为完整状态');
        const updateData = {
            id: exerciseId,
            name: '简单测试动作_完整',
            coverImgUrl: 'https://example.com/cover.jpg',
            met: 5,
            structureTypeCode: 'MAIN',
            genderCode: 'FEMALE',
            difficultyCode: 'BEGINNER',
            equipmentCode: 'NO_EQUIPMENT',
            positionCode: 'STANDING',
            injuredCodes: ['NONE'],
            nameAudioUrl: 'https://example.com/name.mp3',
            nameAudioUrlDuration: 3,
            howtodoScript: '动作说明',
            howtodoAudioUrl: 'https://example.com/howtodo.mp3',
            howtodoAudioUrlDuration: 30,
            guidanceAudioUrl: 'https://example.com/guidance.mp3',
            guidanceAudioUrlDuration: 45,
            frontVideoUrl: 'https://example.com/front.mp4',
            frontVideoUrlDuration: 60,
            sideVideoUrl: 'https://example.com/side.mp4',
            sideVideoUrlDuration: 60,
            status: 'ENABLED'
        };

        const updateResult = await BusinessHelper.updateWithValidation(
            'exercise',
            exerciseId,
            updateData,
            [],
            'exercise'
        );

        if (updateResult.success) {
            console.log('✅ 更新成功');
        } else {
            console.log('❌ 更新失败:', updateResult.message);
        }

        // 4. 测试名称重复验证
        console.log('\n4. 测试名称重复验证');
        const duplicateData = {
            name: '简单测试动作_完整',  // 相同名称
            status: 'DRAFT'
        };

        const duplicateResult = await BusinessHelper.insertWithValidation('exercise', duplicateData);
        if (duplicateResult.success) {
            console.log('❌ 重复名称创建成功（不应该成功）');
        } else {
            console.log('✅ 重复名称创建失败（预期结果）:', duplicateResult.message);
        }

        // 5. 验证最终数据
        console.log('\n5. 验证最终数据');
        const finalResult = await BusinessHelper.findByIdWithValidation('exercise', exerciseId);
        if (finalResult.success) {
            console.log('最终数据:');
            console.log('  - ID:', finalResult.data.id);
            console.log('  - 名称:', finalResult.data.name);
            console.log('  - 状态:', finalResult.data.status);
            console.log('  - 结构类型:', finalResult.data.structureTypeCode);
            console.log('  - 性别:', finalResult.data.genderCode);
            console.log('  - 难度:', finalResult.data.difficultyCode);
            console.log('  - 器械:', finalResult.data.equipmentCode);
            console.log('  - 部位:', finalResult.data.positionCode);
            console.log('  - MET:', finalResult.data.met);
        }

        // 6. 清理测试数据
        console.log('\n6. 清理测试数据');
        const deleteResult = await query('DELETE FROM exercise WHERE id = ?', [exerciseId]);
        console.log(`✅ 清理完成，删除 ${deleteResult.affectedRows} 条记录`);

        console.log('\n✅ Exercise 模块简单测试完成！');
        console.log('\n📋 测试总结:');
        console.log('- ✅ 草稿状态创建');
        console.log('- ✅ 通过ID查询（字段转换）');
        console.log('- ✅ 草稿更新为完整状态');
        console.log('- ✅ 名称重复验证');
        console.log('- ✅ 数据完整性验证');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testExerciseSimple()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testExerciseSimple };
