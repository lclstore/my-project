/**
 * 测试时间字段识别功能
 */

const { isTimeField } = require('../utils/fieldConverter');

function testTimeFieldDetection() {
    console.log('🚀 开始测试时间字段识别功能...\n');

    // 测试用例
    const testCases = [
        // 应该被识别为时间字段的
        { field: 'create_time', expected: true, description: '创建时间字段' },
        { field: 'update_time', expected: true, description: '更新时间字段' },
        { field: 'createTime', expected: true, description: '驼峰创建时间字段' },
        { field: 'updateTime', expected: true, description: '驼峰更新时间字段' },
        
        // 不应该被识别为时间字段的（音频相关数字字段）
        { field: 'execution_rest_audio_end_time', expected: false, description: '音频结束时间（数字）' },
        { field: 'preview_first_audio_start_time', expected: false, description: '音频开始时间（数字）' },
        { field: 'executionRestAudioEndTime', expected: false, description: '驼峰音频结束时间（数字）' },
        { field: 'previewFirstAudioStartTime', expected: false, description: '驼峰音频开始时间（数字）' },
        { field: 'intro_audio_duration', expected: false, description: '音频时长（数字）' },
        { field: 'video_duration', expected: false, description: '视频时长（数字）' },
        
        // 其他字段
        { field: 'status', expected: false, description: '状态字段' },
        { field: 'intro_video_reps', expected: false, description: '视频重复次数' },
        { field: 'execution_halfway_audio_biz_sound_ids', expected: false, description: 'JSON数组字段' }
    ];

    let passedTests = 0;
    let totalTests = testCases.length;

    console.log('测试结果:');
    console.log('========================================');

    testCases.forEach(({ field, expected, description }) => {
        const result = isTimeField(field);
        const passed = result === expected;
        
        console.log(`${passed ? '✅' : '❌'} ${field}`);
        console.log(`   描述: ${description}`);
        console.log(`   期望: ${expected ? '时间字段' : '非时间字段'}`);
        console.log(`   实际: ${result ? '时间字段' : '非时间字段'}`);
        console.log('');

        if (passed) {
            passedTests++;
        }
    });

    console.log('========================================');
    console.log(`测试总结: ${passedTests}/${totalTests} 通过`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！');
        return true;
    } else {
        console.log('❌ 部分测试失败');
        return false;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const success = testTimeFieldDetection();
    process.exit(success ? 0 : 1);
}

module.exports = { testTimeFieldDetection };
