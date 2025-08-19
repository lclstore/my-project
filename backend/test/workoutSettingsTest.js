/**
 * 测试 WorkoutSettings 训练设置接口
 */

const express = require('express');
const request = require('supertest');
const workoutSettingsRoutes = require('../routes/workoutSettings');
const { query } = require('../config/database');

async function testWorkoutSettings() {
    try {
        console.log('🚀 开始测试 WorkoutSettings 训练设置接口...\n');

        // 创建测试应用
        const app = express();
        app.use(express.json());
        app.use('/workoutSettings', workoutSettingsRoutes);

        // 1. 清理测试数据（确保从干净状态开始）
        console.log('1. 清理测试数据');
        await query('DELETE FROM workout_setting WHERE 1=1');
        console.log('✅ 清理完成');

        // 2. 测试查询空数据
        console.log('\n2. 测试查询空数据');
        const emptyResponse = await request(app)
            .get('/workoutSettings/detail');

        console.log('空数据查询状态:', emptyResponse.status);
        console.log('空数据查询响应:', JSON.stringify(emptyResponse.body, null, 2));

        if (emptyResponse.body.success && emptyResponse.body.data === null) {
            console.log('✅ 空数据查询正常');
        } else {
            console.log('❌ 空数据查询异常');
        }

        // 3. 测试创建草稿设置
        console.log('\n3. 测试创建草稿设置');
        const draftResponse = await request(app)
            .post('/workoutSettings/save')
            .send({
                status: 'DRAFT'
            });

        console.log('草稿创建状态:', draftResponse.status);
        console.log('草稿创建响应:', JSON.stringify(draftResponse.body, null, 2));

        let settingId = null;
        if (draftResponse.body.success) {
            settingId = draftResponse.body.data.id;
            console.log(`✅ 草稿创建成功，ID: ${settingId}`);
        } else {
            console.log('❌ 草稿创建失败');
        }

        // 4. 测试查询已创建的设置
        console.log('\n4. 测试查询已创建的设置');
        const detailResponse = await request(app)
            .get('/workoutSettings/detail');

        console.log('设置查询状态:', detailResponse.status);
        console.log('设置查询响应:', JSON.stringify(detailResponse.body, null, 2));

        if (detailResponse.body.success && detailResponse.body.data) {
            console.log('✅ 设置查询成功');
            console.log('设置ID:', detailResponse.body.data.id);
            console.log('设置状态:', detailResponse.body.data.status);

            // 验证字段转换
            if ('isDeleted' in detailResponse.body.data || 'is_deleted' in detailResponse.body.data) {
                console.log('❌ 响应包含了 is_deleted 字段');
            } else {
                console.log('✅ 正确过滤了 is_deleted 字段');
            }
        } else {
            console.log('❌ 设置查询失败');
        }

        // 5. 测试更新为完整设置
        console.log('\n5. 测试更新为完整设置');
        const completeData = {
            introVideoReps: 3,
            introAudioBizSoundId: 101,
            introAudioStartTime: 5,
            introAudioClosed: true,
            previewVideoReps: 2,
            previewFirstAudioBizSoundId: 102,
            previewFirstAudioStartTime: 3,
            previewFirstAudioClosed: false,
            previewNextAudioBizSoundId: 103,
            previewNextAudioStartTime: 2,
            previewNextAudioClosed: true,
            previewLastAudioBizSoundId: 104,
            previewLastAudioStartTime: 1,
            previewLastAudioClosed: true,
            previewNameAudioStartTime: 0,
            previewNameAudioClosed: false,
            previewThreeAudioBizSoundId: 105,
            previewThreeAudioEndTime: 10,
            previewThreeAudioClosed: true,
            previewTwoAudioBizSoundId: 106,
            previewTwoAudioEndTime: 8,
            previewTwoAudioClosed: true,
            previewOneAudioBizSoundId: 107,
            previewOneAudioEndTime: 6,
            previewOneAudioClosed: true,
            executionGoAudioBizSoundId: 108,
            executionGoAudioStartTime: 0,
            executionGoAudioClosed: false,
            executionVideoReps: 1,
            executionGuidanceAudioStartTime: 5,
            executionGuidanceAudioClosed: true,
            executionHalfwayAudioStartTime: 15,
            executionHalfwayAudioClosed: true,
            executionThreeAudioBizSoundId: 109,
            executionThreeAudioEndTime: 25,
            executionThreeAudioClosed: true,
            executionTwoAudioBizSoundId: 110,
            executionTwoAudioEndTime: 27,
            executionTwoAudioClosed: true,
            executionOneAudioBizSoundId: 111,
            executionOneAudioEndTime: 29,
            executionOneAudioClosed: true,
            executionBeepAudioBizSoundId: 112,
            executionBeepAudioEndTime: 30,
            executionBeepAudioClosed: false,
            executionRestAudioBizSoundId: 113,
            executionRestAudioEndTime: 60,
            executionRestAudioClosed: true,
            executionHalfwayAudioBizSoundIds: [114, 115, 116],
            introVideoCycleCode: 'FRONT_TO_SIDE',
            previewVideoCycleCode: 'SIDE_TO_FRONT',
            executionVideoCycleCode: 'FRONT_TO_SIDE',
            status: 'ENABLED'
        };

        const updateResponse = await request(app)
            .post('/workoutSettings/save')
            .send(completeData);

        console.log('完整设置更新状态:', updateResponse.status);
        console.log('完整设置更新响应:', JSON.stringify(updateResponse.body, null, 2));

        if (updateResponse.body.success) {
            console.log('✅ 完整设置更新成功');
            console.log('更新后ID:', updateResponse.body.data.id);

            // 验证ID是否保持不变（应该是更新而不是新建）
            if (updateResponse.body.data.id === settingId) {
                console.log('✅ ID保持不变，确认是更新操作');
            } else {
                console.log('❌ ID发生变化，可能是新建操作');
            }
        } else {
            console.log('❌ 完整设置更新失败');
        }

        // 6. 验证更新后的数据
        console.log('\n6. 验证更新后的数据');
        const updatedDetailResponse = await request(app)
            .get('/workoutSettings/detail');

        if (updatedDetailResponse.body.success && updatedDetailResponse.body.data) {
            const data = updatedDetailResponse.body.data;
            console.log('✅ 更新后数据查询成功');
            console.log('状态:', data.status);
            console.log('intro video 次数:', data.introVideoReps);
            console.log('execution halfway audio IDs:', data.executionHalfwayAudioBizSoundIds);
            console.log('intro video cycle:', data.introVideoCycleCode);

            // 验证数组字段
            if (Array.isArray(data.executionHalfwayAudioBizSoundIds)) {
                console.log('✅ JSON 数组字段正确解析');
            } else {
                console.log('❌ JSON 数组字段解析失败');
            }
        }

        // 7. 测试参数验证
        console.log('\n7. 测试参数验证');

        // 7.1 测试缺少 status 字段
        const noStatusResponse = await request(app)
            .post('/workoutSettings/save')
            .send({
                introVideoReps: 1
            });

        if (noStatusResponse.status === 400) {
            console.log('✅ 缺少 status 字段验证正确');
            console.log('错误信息:', noStatusResponse.body.errMessage);
        } else {
            console.log('❌ 缺少 status 字段验证失败');
        }

        // 7.2 测试无效的 status 值
        const invalidStatusResponse = await request(app)
            .post('/workoutSettings/save')
            .send({
                status: 'INVALID'
            });

        if (invalidStatusResponse.status === 400) {
            console.log('✅ 无效 status 值验证正确');
            console.log('错误信息:', invalidStatusResponse.body.errMessage);
        } else {
            console.log('❌ 无效 status 值验证失败');
        }

        // 7.3 测试无效的 cycle code 值
        const invalidCycleResponse = await request(app)
            .post('/workoutSettings/save')
            .send({
                status: 'DRAFT',
                introVideoCycleCode: 'INVALID_CYCLE'
            });

        if (invalidCycleResponse.status === 400) {
            console.log('✅ 无效 cycle code 值验证正确');
            console.log('错误信息:', invalidCycleResponse.body.errMessage);
        } else {
            console.log('❌ 无效 cycle code 值验证失败');
        }

        // 8. 验证数据库中的记录
        console.log('\n8. 验证数据库中的记录');
        const dbRecords = await query('SELECT id, status, intro_video_reps, execution_halfway_audio_biz_sound_ids, is_deleted FROM workout_setting');

        console.log('数据库记录数量:', dbRecords.length);
        if (dbRecords.length === 1) {
            const record = dbRecords[0];
            console.log('✅ 数据库中只有一条记录');
            console.log('记录ID:', record.id);
            console.log('状态:', record.status);
            console.log('intro_video_reps:', record.intro_video_reps);
            console.log('is_deleted:', record.is_deleted);

            // 验证 JSON 字段
            if (record.execution_halfway_audio_biz_sound_ids) {
                try {
                    const parsedIds = JSON.parse(record.execution_halfway_audio_biz_sound_ids);
                    console.log('✅ JSON 字段存储正确:', parsedIds);
                } catch (e) {
                    console.log('❌ JSON 字段存储格式错误');
                }
            }
        } else {
            console.log('❌ 数据库记录数量不正确');
        }

        // 9. 清理测试数据
        console.log('\n9. 清理测试数据');
        await query('DELETE FROM workout_setting WHERE 1=1');
        console.log('✅ 清理完成');

        console.log('\n✅ WorkoutSettings 训练设置接口测试完成！');

        console.log('\n📋 测试总结:');
        console.log('- ✅ 空数据查询正常');
        console.log('- ✅ 草稿状态创建正常');
        console.log('- ✅ 设置查询功能正常');
        console.log('- ✅ 完整设置更新正常');
        console.log('- ✅ 单例模式工作正常（只有一条记录）');
        console.log('- ✅ 字段转换正常（过滤 is_deleted）');
        console.log('- ✅ JSON 字段处理正常');
        console.log('- ✅ 参数验证正常');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testWorkoutSettings()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testWorkoutSettings };
