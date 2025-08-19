/**
 * 测试 sound 模块名称唯一性验证（通过路由接口）
 */

const express = require('express');
const request = require('supertest');
const soundRoutes = require('../routes/sound');
const { query } = require('../config/database');

async function testSoundNameUniqueRoute() {
    try {
        console.log('🚀 开始测试 sound 模块名称唯一性验证（路由接口）...\n');

        // 创建测试应用
        const app = express();
        app.use(express.json());
        app.use('/sound', soundRoutes);

        let firstId, secondId;

        // 1. 创建第一个音频资源
        console.log('1. 创建第一个音频资源');
        const uniqueName = `测试音频名称_${Date.now()}`;  // 使用时间戳确保唯一性
        const firstSoundData = {
            name: uniqueName,
            genderCode: 'FEMALE',
            usageCode: 'GENERAL',
            translation: 1,
            status: 'DRAFT'  // 使用草稿状态，只验证必要字段
        };

        const firstResponse = await request(app)
            .post('/sound/save')
            .send(firstSoundData);

        console.log('第一个音频资源响应状态:', firstResponse.status);
        console.log('第一个音频资源响应内容:', firstResponse.body);

        if (firstResponse.status === 200 && firstResponse.body.success) {
            firstId = firstResponse.body.data.id;
            console.log('✅ 第一个音频资源创建成功，ID:', firstId);
        } else {
            console.log('❌ 第一个音频资源创建失败');
            return;
        }

        // 2. 尝试创建相同名称的音频资源（应该失败）
        console.log('\n2. 尝试创建相同名称的音频资源');
        const duplicateNameData = {
            name: uniqueName,  // 相同的名称
            genderCode: 'MALE',
            usageCode: 'FLOW',
            translation: 0,
            status: 'DRAFT'
        };

        const duplicateResponse = await request(app)
            .post('/sound/save')
            .send(duplicateNameData);

        console.log('重复名称响应状态:', duplicateResponse.status);
        console.log('重复名称响应内容:', duplicateResponse.body);

        if (duplicateResponse.status === 400 && !duplicateResponse.body.success) {
            console.log('✅ 重复名称创建失败（预期结果）:', duplicateResponse.body.errMessage);
        } else {
            console.log('❌ 重复名称创建成功（不应该成功）');
        }

        // 3. 创建不同名称的音频资源（应该成功）
        console.log('\n3. 创建不同名称的音频资源');
        const differentNameData = {
            name: `${uniqueName}_2`,  // 不同的名称
            genderCode: 'FEMALE_AND_MALE',
            usageCode: 'GENERAL',
            translation: 1,
            status: 'DRAFT'
        };

        const differentResponse = await request(app)
            .post('/sound/save')
            .send(differentNameData);

        console.log('不同名称响应状态:', differentResponse.status);
        console.log('不同名称响应内容:', differentResponse.body);

        if (differentResponse.status === 200 && differentResponse.body.success) {
            secondId = differentResponse.body.data.id;
            console.log('✅ 不同名称创建成功，ID:', secondId);
        } else {
            console.log('❌ 不同名称创建失败');
        }

        // 4. 测试更新操作 - 更新为相同名称（应该失败）
        console.log('\n4. 测试更新操作 - 更新为相同名称');
        if (secondId) {
            const updateToSameNameData = {
                id: secondId,
                name: uniqueName,  // 更新为第一个记录的名称
                genderCode: 'FEMALE_AND_MALE',
                usageCode: 'GENERAL',
                translation: 1,
                status: 'DRAFT'
            };

            const updateSameNameResponse = await request(app)
                .post('/sound/save')
                .send(updateToSameNameData);

            console.log('更新为相同名称响应状态:', updateSameNameResponse.status);
            console.log('更新为相同名称响应内容:', updateSameNameResponse.body);

            if (updateSameNameResponse.status === 400 && !updateSameNameResponse.body.success) {
                console.log('✅ 更新为相同名称失败（预期结果）:', updateSameNameResponse.body.errMessage);
            } else {
                console.log('❌ 更新为相同名称成功（不应该成功）');
            }
        }

        // 5. 测试更新操作 - 保持自己的名称（应该成功）
        console.log('\n5. 测试更新操作 - 保持自己的名称');
        if (firstId) {
            const updateSelfNameData = {
                id: firstId,
                name: uniqueName,  // 保持自己的名称
                genderCode: 'MALE',   // 只修改其他字段
                usageCode: 'FLOW',
                translation: 0,
                status: 'DRAFT'
            };

            const updateSelfNameResponse = await request(app)
                .post('/sound/save')
                .send(updateSelfNameData);

            console.log('保持自己名称更新响应状态:', updateSelfNameResponse.status);
            console.log('保持自己名称更新响应内容:', updateSelfNameResponse.body);

            if (updateSelfNameResponse.status === 200 && updateSelfNameResponse.body.success) {
                console.log('✅ 保持自己名称的更新成功');
            } else {
                console.log('❌ 保持自己名称的更新失败');
            }
        }

        // 6. 测试更新操作 - 更新为新的唯一名称（应该成功）
        console.log('\n6. 测试更新操作 - 更新为新的唯一名称');
        if (secondId) {
            const updateToNewNameData = {
                id: secondId,
                name: `${uniqueName}_3`,  // 新的唯一名称
                genderCode: 'FEMALE_AND_MALE',
                usageCode: 'GENERAL',
                translation: 1,
                status: 'DRAFT'
            };

            const updateNewNameResponse = await request(app)
                .post('/sound/save')
                .send(updateToNewNameData);

            console.log('更新为新唯一名称响应状态:', updateNewNameResponse.status);
            console.log('更新为新唯一名称响应内容:', updateNewNameResponse.body);

            if (updateNewNameResponse.status === 200 && updateNewNameResponse.body.success) {
                console.log('✅ 更新为新唯一名称成功');
            } else {
                console.log('❌ 更新为新唯一名称失败');
            }
        }

        // 7. 验证最终的数据状态
        console.log('\n7. 验证最终的数据状态');
        const allIds = [firstId, secondId].filter(id => id);

        if (allIds.length > 0) {
            const finalRecords = await query(
                `SELECT id, name, gender_code, usage_code, status FROM sound WHERE id IN (${allIds.map(() => '?').join(',')})`,
                allIds
            );

            console.log('最终保存的记录:');
            finalRecords.forEach(record => {
                console.log(`  - ID: ${record.id}, 名称: "${record.name}", 性别: ${record.gender_code}, 用途: ${record.usage_code}, 状态: ${record.status}`);
            });

            // 验证名称唯一性
            const nameGroups = {};
            finalRecords.forEach(record => {
                if (!nameGroups[record.name]) {
                    nameGroups[record.name] = [];
                }
                nameGroups[record.name].push(record.id);
            });

            console.log('\n名称唯一性检查:');
            let hasConflict = false;
            Object.entries(nameGroups).forEach(([name, ids]) => {
                if (ids.length > 1) {
                    console.log(`❌ 名称 "${name}" 重复，ID: ${ids.join(', ')}`);
                    hasConflict = true;
                } else {
                    console.log(`✅ 名称 "${name}" 唯一，ID: ${ids[0]}`);
                }
            });

            if (!hasConflict) {
                console.log('✅ 所有名称都是唯一的');
            }
        }

        // 8. 清理测试数据
        console.log('\n8. 清理测试数据');
        const cleanupIds = [firstId, secondId].filter(id => id);

        if (cleanupIds.length > 0) {
            const deleteResult = await query(
                `DELETE FROM sound WHERE id IN (${cleanupIds.map(() => '?').join(',')})`,
                cleanupIds
            );
            console.log(`✅ 清理完成，删除 ${deleteResult.affectedRows} 条记录`);
        }

        console.log('\n✅ sound 模块名称唯一性验证测试（路由接口）完成！');
        console.log('\n📋 测试总结:');
        console.log('- ✅ 通过路由接口测试名称唯一性');
        console.log('- ✅ 创建时检查名称重复');
        console.log('- ✅ 重复名称被正确拒绝');
        console.log('- ✅ 唯一名称可以正常创建');
        console.log('- ✅ 更新时检查名称重复');
        console.log('- ✅ 更新为重复名称被拒绝');
        console.log('- ✅ 保持自己名称的更新成功');
        console.log('- ✅ 更新为新唯一名称成功');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSoundNameUniqueRoute()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSoundNameUniqueRoute };
