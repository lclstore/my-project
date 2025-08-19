/**
 * 测试 workoutSettings/detail 接口响应格式
 */

const express = require('express');
const request = require('supertest');
const workoutSettingsRoutes = require('../routes/workoutSettings');
const { query } = require('../config/database');

async function testWorkoutDetailResponse() {
    try {
        console.log('🚀 开始测试 workoutSettings/detail 接口响应格式...\n');

        // 创建测试应用
        const app = express();
        app.use(express.json());
        app.use('/workoutSettings', workoutSettingsRoutes);

        // 1. 清理并创建测试数据
        console.log('1. 准备测试数据');
        await query('DELETE FROM workout_setting WHERE 1=1');

        // 创建一条测试记录
        const testData = {
            status: 'ENABLED',
            introVideoReps: 3,
            introAudioBizSoundId: 101,
            executionRestAudioEndTime: 30,  // 这应该是数字，不应该被格式化为时间
            previewFirstAudioStartTime: 5   // 这应该是数字，不应该被格式化为时间
        };

        const saveResponse = await request(app)
            .post('/workoutSettings/save')
            .send(testData);

        if (saveResponse.status !== 200) {
            throw new Error('创建测试数据失败: ' + JSON.stringify(saveResponse.body));
        }
        console.log('✅ 测试数据创建成功');

        // 2. 测试 detail 接口
        console.log('\n2. 测试 detail 接口响应');
        const detailResponse = await request(app)
            .get('/workoutSettings/detail');

        console.log('响应状态:', detailResponse.status);

        if (detailResponse.status === 200 && detailResponse.body.success) {
            const data = detailResponse.body.data;

            console.log('\n关键字段检查:');
            console.log('========================================');

            // 检查时间字段格式
            console.log('createTime:', data.createTime, '(应该是时间格式)');
            console.log('updateTime:', data.updateTime, '(应该是时间格式)');

            // 检查数字字段格式
            console.log('executionRestAudioEndTime:', data.executionRestAudioEndTime, '(应该是数字)');
            console.log('previewFirstAudioStartTime:', data.previewFirstAudioStartTime, '(应该是数字)');
            console.log('introVideoReps:', data.introVideoReps, '(应该是数字)');

            // 验证字段类型
            const checks = [
                {
                    field: 'createTime',
                    value: data.createTime,
                    test: (v) => typeof v === 'string' && v.includes('-') && v.includes(':'),
                    description: '应该是时间字符串格式'
                },
                {
                    field: 'executionRestAudioEndTime',
                    value: data.executionRestAudioEndTime,
                    test: (v) => typeof v === 'number' || (typeof v === 'string' && !v.includes('1970')),
                    description: '应该是数字，不应该是1970年的时间'
                },
                {
                    field: 'previewFirstAudioStartTime',
                    value: data.previewFirstAudioStartTime,
                    test: (v) => typeof v === 'number' || (typeof v === 'string' && !v.includes('1970')),
                    description: '应该是数字，不应该是1970年的时间'
                }
            ];

            console.log('\n字段类型验证:');
            console.log('========================================');

            let allPassed = true;
            checks.forEach(({ field, value, test, description }) => {
                const passed = test(value);
                console.log(`${passed ? '✅' : '❌'} ${field}: ${value}`);
                console.log(`   ${description}`);
                if (!passed) allPassed = false;
            });

            if (allPassed) {
                console.log('\n🎉 所有字段格式验证通过！');
            } else {
                console.log('\n❌ 部分字段格式验证失败');
            }

        } else {
            console.log('❌ detail 接口调用失败');
            console.log('响应:', JSON.stringify(detailResponse.body, null, 2));
        }

        // 3. 清理测试数据
        console.log('\n3. 清理测试数据');
        await query('DELETE FROM workout_setting WHERE 1=1');
        console.log('✅ 清理完成');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testWorkoutDetailResponse()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testWorkoutDetailResponse };
