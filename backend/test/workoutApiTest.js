/**
 * Workout API接口测试
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:8080/api';
const API_TOKEN = 'test-token'; // 根据实际情况修改

// 创建axios实例
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
        'token': API_TOKEN
    }
});

// 测试数据
const testWorkoutData = {
    name: "API测试训练",
    description: "通过API创建的测试训练",
    premium: 0,
    genderCode: "MALE",
    difficultyCode: "BEGINNER",
    positionCode: "STANDING",
    injuredCodes: ["NONE"],
    calorie: 250,
    duration: 1500,
    status: "ENABLED",
    exerciseGroupList: [
        {
            structureName: "热身阶段",
            structureRound: 1,
            exerciseList: [1, 2]
        },
        {
            structureName: "主要训练",
            structureRound: 2,
            exerciseList: [3, 4, 5]
        }
    ]
};

// 测试保存workout
async function testSaveWorkout() {
    try {
        console.log('🔍 测试保存workout...');

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

// 测试查询workout详情
async function testGetWorkoutDetail(workoutId) {
    try {
        console.log('\n🔍 测试查询workout详情...');

        const response = await api.get(`/workout/detail/${workoutId}`);

        if (response.data.success) {
            console.log('✅ 查询workout详情成功');
            console.log(`   名称: ${response.data.data.name}`);
            console.log(`   描述: ${response.data.data.description}`);
            console.log(`   动作组数量: ${response.data.data.exerciseGroupList?.length || 0}`);
            console.log(`   受伤类型: ${response.data.data.injuredCodes?.join(', ') || '无'}`);
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

// 测试分页查询workout列表
async function testGetWorkoutPage() {
    try {
        console.log('\n🔍 测试分页查询workout列表...');

        const response = await api.get('/workout/page?pageIndex=1&pageSize=10');

        if (response.data.success) {
            console.log('✅ 分页查询workout列表成功');
            console.log(`   总数量: ${response.data.data.totalCount}`);
            console.log(`   当前页数据量: ${response.data.data.data.length}`);
            return true;
        } else {
            console.log('❌ 分页查询workout列表失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 分页查询workout列表请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试启用workout
async function testEnableWorkout(workoutIds) {
    try {
        console.log('\n🔍 测试启用workout...');

        const response = await api.post('/workout/enable', {
            idList: workoutIds
        });

        if (response.data.success) {
            console.log('✅ 启用workout成功');
            console.log(`   更新数量: ${response.data.data.updatedCount}`);
            return true;
        } else {
            console.log('❌ 启用workout失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 启用workout请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试禁用workout
async function testDisableWorkout(workoutIds) {
    try {
        console.log('\n🔍 测试禁用workout...');

        const response = await api.post('/workout/disable', {
            idList: workoutIds
        });

        if (response.data.success) {
            console.log('✅ 禁用workout成功');
            console.log(`   更新数量: ${response.data.data.updatedCount}`);
            return true;
        } else {
            console.log('❌ 禁用workout失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 禁用workout请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试删除workout
async function testDeleteWorkout(workoutIds) {
    try {
        console.log('\n🔍 测试逻辑删除workout...');

        const response = await api.post('/workout/del', {
            idList: workoutIds
        });

        if (response.data.success) {
            console.log('✅ 逻辑删除workout成功');
            console.log(`   删除数量: ${response.data.data.deletedCount}`);
            return true;
        } else {
            console.log('❌ 逻辑删除workout失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 逻辑删除workout请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 验证逻辑删除效果
async function testLogicalDeleteEffect(workoutId) {
    try {
        console.log('\n🔍 验证逻辑删除效果...');

        const response = await api.get(`/workout/detail/${workoutId}`);

        if (response.data.success) {
            console.log('❌ 逻辑删除验证失败: 已删除的数据仍可查询到');
            return false;
        } else {
            console.log('✅ 逻辑删除验证成功: 已删除的数据无法查询到');
            return true;
        }
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('✅ 逻辑删除验证成功: 已删除的数据返回404');
            return true;
        } else {
            console.error('❌ 验证逻辑删除效果请求失败:', error.response?.data || error.message);
            return false;
        }
    }
}

// 主测试函数
async function runApiTests() {
    console.log('🚀 开始Workout API接口测试\n');

    try {
        // 1. 测试保存workout
        const workoutId = await testSaveWorkout();
        if (!workoutId) {
            console.log('💥 保存workout失败，终止测试');
            return;
        }

        // 2. 测试查询详情
        await testGetWorkoutDetail(workoutId);

        // 3. 测试分页查询
        await testGetWorkoutPage();

        // 4. 测试启用workout
        await testEnableWorkout([workoutId]);

        // 5. 测试禁用workout
        await testDisableWorkout([workoutId]);

        // 6. 测试删除workout
        await testDeleteWorkout([workoutId]);

        // 7. 验证逻辑删除效果
        await testLogicalDeleteEffect(workoutId);

        console.log('\n✅ Workout API接口测试完成');

    } catch (error) {
        console.error('\n💥 API测试过程中发生错误:', error);
    }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runApiTests().catch(console.error);
}

module.exports = {
    runApiTests,
    testSaveWorkout,
    testGetWorkoutDetail,
    testGetWorkoutPage,
    testEnableWorkout,
    testDisableWorkout,
    testDeleteWorkout,
    testLogicalDeleteEffect
};
