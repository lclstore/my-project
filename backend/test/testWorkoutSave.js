/**
 * 测试workout保存功能，特别是处理undefined参数的情况
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:8080/api';
const API_TOKEN = 'test-token';

// 创建axios实例
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
        'token': API_TOKEN
    }
});

// 测试数据 - 包含一些undefined值的情况
const testWorkoutData = {
    name: "测试训练（包含undefined字段）",
    description: "测试处理undefined参数的情况",
    premium: 0,
    // newStartTime: undefined, // 故意不设置，会是undefined
    // newEndTime: undefined,   // 故意不设置，会是undefined
    // coverImgUrl: undefined,  // 故意不设置，会是undefined
    genderCode: "MALE",
    difficultyCode: "BEGINNER",
    positionCode: "STANDING",
    injuredCodes: ["NONE"],
    calorie: 250,
    // duration: undefined,     // 故意不设置，会是undefined
    status: "DRAFT",
    exerciseGroupList: [
        {
            structureName: "热身阶段",
            structureRound: 1,
            exerciseList: [1, 2]
        }
    ]
};

// 测试保存workout（包含undefined字段）
async function testSaveWorkoutWithUndefined() {
    try {
        console.log('🔍 测试保存workout（包含undefined字段）...');
        console.log('测试数据:', JSON.stringify(testWorkoutData, null, 2));
        
        const response = await api.post('/workout/save', testWorkoutData);
        
        if (response.data.success) {
            console.log('✅ 保存workout成功');
            console.log(`   workout ID: ${response.data.data.id}`);
            return response.data.data.id;
        } else {
            console.log('❌ 保存workout失败:', response.data.errMessage);
            return null;
        }
    } catch (error) {
        console.error('❌ 保存workout请求失败:', error.response?.data || error.message);
        return null;
    }
}

// 测试查询保存的workout
async function testGetWorkoutDetail(workoutId) {
    try {
        console.log('\n🔍 测试查询保存的workout详情...');
        
        const response = await api.get(`/workout/detail/${workoutId}`);
        
        if (response.data.success) {
            console.log('✅ 查询workout详情成功');
            console.log('   详情数据:');
            console.log(`     名称: ${response.data.data.name}`);
            console.log(`     描述: ${response.data.data.description}`);
            console.log(`     开始时间: ${response.data.data.newStartTime || 'null'}`);
            console.log(`     结束时间: ${response.data.data.newEndTime || 'null'}`);
            console.log(`     封面图: ${response.data.data.coverImgUrl || 'null'}`);
            console.log(`     时长: ${response.data.data.duration || 'null'}`);
            console.log(`     状态: ${response.data.data.status}`);
            return true;
        } else {
            console.log('❌ 查询workout详情失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 查询workout详情请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试修改workout（包含undefined字段）
async function testUpdateWorkoutWithUndefined(workoutId) {
    try {
        console.log('\n🔍 测试修改workout（包含undefined字段）...');
        
        const updateData = {
            id: workoutId,
            name: "修改后的测试训练",
            description: "修改后的描述",
            // premium: undefined,      // 故意不设置
            genderCode: "FEMALE",
            // difficultyCode: undefined, // 故意不设置
            positionCode: "SEATED",
            injuredCodes: ["SHOULDER", "BACK"],
            calorie: 300,
            duration: 1800,
            status: "ENABLED"
        };
        
        console.log('修改数据:', JSON.stringify(updateData, null, 2));
        
        const response = await api.post('/workout/save', updateData);
        
        if (response.data.success) {
            console.log('✅ 修改workout成功');
            console.log(`   workout ID: ${response.data.data.id}`);
            return true;
        } else {
            console.log('❌ 修改workout失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 修改workout请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 清理测试数据
async function cleanupTestData(workoutId) {
    try {
        console.log('\n🔍 清理测试数据...');
        
        const response = await api.post('/workout/del', {
            idList: [workoutId]
        });
        
        if (response.data.success) {
            console.log('✅ 清理测试数据成功');
        } else {
            console.log('❌ 清理测试数据失败:', response.data.errMessage);
        }
    } catch (error) {
        console.error('❌ 清理测试数据失败:', error.response?.data || error.message);
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试workout保存功能（undefined参数处理）\n');
    
    try {
        // 1. 测试保存包含undefined字段的workout
        const workoutId = await testSaveWorkoutWithUndefined();
        if (!workoutId) {
            console.log('💥 保存测试失败，终止测试');
            return;
        }
        
        // 2. 测试查询保存的workout
        await testGetWorkoutDetail(workoutId);
        
        // 3. 测试修改包含undefined字段的workout
        await testUpdateWorkoutWithUndefined(workoutId);
        
        // 4. 再次查询验证修改结果
        await testGetWorkoutDetail(workoutId);
        
        // 5. 清理测试数据
        await cleanupTestData(workoutId);
        
        console.log('\n✅ undefined参数处理测试完成');
        
    } catch (error) {
        console.error('\n💥 测试过程中发生错误:', error);
    }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    testSaveWorkoutWithUndefined,
    testGetWorkoutDetail,
    testUpdateWorkoutWithUndefined
};
