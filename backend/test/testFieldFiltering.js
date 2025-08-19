/**
 * 测试字段过滤功能
 * 验证前端传递额外字段时，后端只处理白名单中的字段
 */

const express = require('express');
const request = require('supertest');
const workoutSettingsRoutes = require('../routes/workoutSettings');
const { query } = require('../config/database');

async function testFieldFiltering() {
    try {
        console.log('🚀 开始测试字段过滤功能...\n');

        // 创建测试应用
        const app = express();
        app.use(express.json());
        app.use('/workoutSettings', workoutSettingsRoutes);

        // 1. 清理测试数据
        console.log('1. 清理测试数据');
        await query('DELETE FROM workout_setting WHERE 1=1');
        console.log('✅ 清理完成');

        // 2. 测试包含额外字段的请求
        console.log('\n2. 测试包含额外字段的请求');
        const testData = {
            // 正常字段
            status: 'ENABLED',
            introVideoReps: 3,
            introAudioBizSoundId: 101,

            // 额外的不存在的字段（应该被忽略）
            unknownDateTimeField: '0000-00-00 00:00:00',  // 无效datetime，应该被忽略
            extraField1: 'should be ignored',
            extraField2: 123,
            randomField: {
                nested: 'object'
            },
            // 模拟前端可能传递的其他字段
            someOtherTimeField: '2024-01-01 10:00:00'
        };

        const response = await request(app)
            .post('/workoutSettings/save')
            .send(testData);

        console.log('响应状态:', response.status);
        console.log('响应内容:', JSON.stringify(response.body, null, 2));

        if (response.status === 200 && response.body.success) {
            console.log('✅ 字段过滤测试成功 - 额外字段被正确忽略');
        } else {
            console.log('❌ 字段过滤测试失败');
            console.log('错误信息:', response.body.errMessage);
        }

        // 3. 验证数据库中只存储了白名单字段
        console.log('\n3. 验证数据库中的数据');
        const dbRecords = await query('SELECT * FROM workout_setting WHERE is_deleted = 0');

        if (dbRecords.length > 0) {
            const record = dbRecords[0];
            console.log('数据库记录字段:', Object.keys(record));

            // 检查是否包含我们测试中传递的额外字段
            const hasExtraFields = Object.keys(record).some(key =>
                key.includes('extra') ||
                key.includes('unknown') ||
                key.includes('random') ||
                key.includes('some_other')
            );

            if (!hasExtraFields) {
                console.log('✅ 数据库中没有额外字段，过滤正常');
            } else {
                console.log('❌ 数据库中包含了不应该存在的字段');
            }

            // 检查正常字段是否正确存储
            if (record.status === 'ENABLED' && record.intro_video_reps === 3) {
                console.log('✅ 正常字段存储正确');
            } else {
                console.log('❌ 正常字段存储异常');
            }
        }

        // 4. 清理测试数据
        console.log('\n4. 清理测试数据');
        await query('DELETE FROM workout_setting WHERE 1=1');
        console.log('✅ 清理完成');

        console.log('\n✅ 字段过滤功能测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testFieldFiltering()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testFieldFiltering };
