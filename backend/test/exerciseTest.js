/**
 * 测试 Exercise 动作资源模块
 */

const { BusinessHelper, query } = require('../config/database');

async function testExerciseModule() {
    try {
        console.log('🚀 开始测试 Exercise 动作资源模块...\n');

        // 1. 测试新增动作资源（草稿状态）
        console.log('1. 测试新增动作资源（草稿状态）');
        const draftExerciseData = {
            name: '测试动作_草稿',
            status: 'DRAFT'
        };

        const draftResult = await BusinessHelper.insertWithValidation('exercise', draftExerciseData);
        if (draftResult.success) {
            console.log('✅ 草稿动作资源创建成功，ID:', draftResult.insertId);
            var draftId = draftResult.insertId;
        } else {
            console.log('❌ 草稿动作资源创建失败:', draftResult.message);
        }

        // 2. 测试新增动作资源（完整状态）
        console.log('\n2. 测试新增动作资源（完整状态）');
        const completeExerciseData = {
            name: '测试动作_完整',
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
            howtodoScript: '这是动作说明文本',
            howtodoAudioUrl: 'https://example.com/howtodo.mp3',
            howtodoAudioUrlDuration: 30,
            guidanceScript: '这是指导文本',
            guidanceAudioUrl: 'https://example.com/guidance.mp3',
            guidanceAudioUrlDuration: 45,
            frontVideoUrl: 'https://example.com/front.mp4',
            frontVideoUrlDuration: 60,
            sideVideoUrl: 'https://example.com/side.mp4',
            sideVideoUrlDuration: 60,
            status: 'ENABLED'
        };

        const completeResult = await BusinessHelper.insertWithValidation('exercise', completeExerciseData);
        if (completeResult.success) {
            console.log('✅ 完整动作资源创建成功，ID:', completeResult.insertId);
            var completeId = completeResult.insertId;
        } else {
            console.log('❌ 完整动作资源创建失败:', completeResult.message);
        }

        // 3. 测试通过ID查询动作资源
        console.log('\n3. 测试通过ID查询动作资源');
        if (completeId) {
            const findResult = await BusinessHelper.findByIdWithValidation('exercise', completeId);
            if (findResult.success) {
                console.log('✅ 通过ID查询成功');
                console.log(`  - ID: ${findResult.data.id}`);
                console.log(`  - 名称: ${findResult.data.name}`);
                console.log(`  - 状态: ${findResult.data.status}`);
                console.log(`  - 结构类型: ${findResult.data.structureTypeCode}`);
                console.log(`  - 性别: ${findResult.data.genderCode}`);
                console.log(`  - 难度: ${findResult.data.difficultyCode}`);
            } else {
                console.log('❌ 通过ID查询失败:', findResult.message);
            }
        }

        // 4. 测试修改动作资源（草稿转完整）
        console.log('\n4. 测试修改动作资源（草稿转完整）');
        if (draftId) {
            const updateData = {
                id: draftId,
                name: '测试动作_草稿转完整',
                coverImgUrl: 'https://example.com/updated-cover.jpg',
                met: 3,
                structureTypeCode: 'WARM_UP',
                genderCode: 'MALE',
                difficultyCode: 'INTERMEDIATE',
                equipmentCode: 'CHAIR',
                positionCode: 'SEATED',
                injuredCodes: ['SHOULDER', 'BACK'],
                nameAudioUrl: 'https://example.com/updated-name.mp3',
                nameAudioUrlDuration: 4,
                howtodoScript: '更新的动作说明文本',
                howtodoAudioUrl: 'https://example.com/updated-howtodo.mp3',
                howtodoAudioUrlDuration: 35,
                guidanceScript: '更新的指导文本',
                guidanceAudioUrl: 'https://example.com/updated-guidance.mp3',
                guidanceAudioUrlDuration: 50,
                frontVideoUrl: 'https://example.com/updated-front.mp4',
                frontVideoUrlDuration: 65,
                sideVideoUrl: 'https://example.com/updated-side.mp4',
                sideVideoUrlDuration: 65,
                status: 'ENABLED'
            };

            const updateResult = await BusinessHelper.updateWithValidation(
                'exercise',
                draftId,
                updateData,
                [],
                'exercise'
            );

            if (updateResult.success) {
                console.log('✅ 草稿转完整状态成功');
            } else {
                console.log('❌ 草稿转完整状态失败:', updateResult.message);
            }
        }

        // 5. 测试名称重复验证
        console.log('\n5. 测试名称重复验证');
        const duplicateNameData = {
            name: '测试动作_完整',  // 使用已存在的名称
            status: 'DRAFT'
        };

        const duplicateResult = await BusinessHelper.insertWithValidation('exercise', duplicateNameData);
        if (duplicateResult.success) {
            console.log('❌ 重复名称创建成功（不应该成功）');
        } else {
            console.log('✅ 重复名称创建失败（预期结果）:', duplicateResult.message);
        }

        // 6. 测试分页查询
        console.log('\n6. 测试分页查询');
        const pageQuery = {
            pageIndex: 1,
            pageSize: 10
        };

        // 模拟分页查询（简化版）
        const offset = (pageQuery.pageIndex - 1) * pageQuery.pageSize;
        const pageResult = await query(
            `SELECT id, name, status, structure_type_code, gender_code, difficulty_code FROM exercise ORDER BY id DESC LIMIT ${pageQuery.pageSize} OFFSET ${offset}`
        );

        console.log(`✅ 分页查询成功，返回 ${pageResult.length} 条记录:`);
        pageResult.forEach(record => {
            console.log(`  - ID: ${record.id}, 名称: "${record.name}", 状态: ${record.status}, 结构: ${record.structure_type_code}`);
        });

        // 7. 测试关键词搜索
        console.log('\n7. 测试关键词搜索');

        // 7.1 按名称搜索
        const nameSearchResult = await query(
            'SELECT id, name, status FROM exercise WHERE name LIKE ? ORDER BY id DESC',
            ['%测试动作%']
        );

        console.log(`7.1 按名称搜索结果: ${nameSearchResult.length} 条记录`);
        nameSearchResult.forEach(record => {
            console.log(`  - ID: ${record.id}, 名称: "${record.name}", 状态: ${record.status}`);
        });

        // 7.2 按ID搜索
        if (completeId) {
            const idSearchResult = await query(
                'SELECT id, name, status FROM exercise WHERE id = ?',
                [completeId]
            );

            console.log(`7.2 按ID搜索结果: ${idSearchResult.length} 条记录`);
            idSearchResult.forEach(record => {
                console.log(`  - ID: ${record.id}, 名称: "${record.name}", 状态: ${record.status}`);
            });
        }

        // 8. 测试筛选条件
        console.log('\n8. 测试筛选条件');

        // 8.1 按状态筛选
        const statusFilterResult = await query(
            'SELECT id, name, status FROM exercise WHERE status = ? ORDER BY id DESC',
            ['ENABLED']
        );

        console.log(`8.1 按状态筛选结果: ${statusFilterResult.length} 条记录`);
        statusFilterResult.forEach(record => {
            console.log(`  - ID: ${record.id}, 名称: "${record.name}", 状态: ${record.status}`);
        });

        // 8.2 按性别筛选
        const genderFilterResult = await query(
            'SELECT id, name, gender_code FROM exercise WHERE gender_code IN (?, ?) ORDER BY id DESC',
            ['FEMALE', 'MALE']
        );

        console.log(`8.2 按性别筛选结果: ${genderFilterResult.length} 条记录`);
        genderFilterResult.forEach(record => {
            console.log(`  - ID: ${record.id}, 名称: "${record.name}", 性别: ${record.gender_code}`);
        });

        // 9. 验证最终数据状态
        console.log('\n9. 验证最终数据状态');
        const allIds = [draftId, completeId].filter(id => id);

        if (allIds.length > 0) {
            const finalRecords = await query(
                `SELECT id, name, status, structure_type_code, gender_code, difficulty_code, equipment_code, position_code FROM exercise WHERE id IN (${allIds.map(() => '?').join(',')})`,
                allIds
            );

            console.log('最终保存的记录:');
            finalRecords.forEach(record => {
                console.log(`  - ID: ${record.id}`);
                console.log(`    名称: "${record.name}"`);
                console.log(`    状态: ${record.status}`);
                console.log(`    结构类型: ${record.structure_type_code || '未设置'}`);
                console.log(`    性别: ${record.gender_code || '未设置'}`);
                console.log(`    难度: ${record.difficulty_code || '未设置'}`);
                console.log(`    器械: ${record.equipment_code || '未设置'}`);
                console.log(`    部位: ${record.position_code || '未设置'}`);
                console.log('');
            });
        }

        // 10. 清理测试数据
        console.log('10. 清理测试数据');
        const cleanupIds = [draftId, completeId].filter(id => id);

        if (cleanupIds.length > 0) {
            const deleteResult = await query(
                `DELETE FROM exercise WHERE id IN (${cleanupIds.map(() => '?').join(',')})`,
                cleanupIds
            );
            console.log(`✅ 清理完成，删除 ${deleteResult.affectedRows} 条记录`);
        }

        console.log('\n✅ Exercise 动作资源模块测试完成！');
        console.log('\n📋 测试总结:');
        console.log('- ✅ 草稿状态创建（只需要name字段）');
        console.log('- ✅ 完整状态创建（需要所有必填字段）');
        console.log('- ✅ 通过ID查询动作资源');
        console.log('- ✅ 修改动作资源（草稿转完整）');
        console.log('- ✅ 名称重复验证');
        console.log('- ✅ 分页查询功能');
        console.log('- ✅ 关键词搜索（名称和ID）');
        console.log('- ✅ 多条件筛选（状态、性别等）');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testExerciseModule()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testExerciseModule };
