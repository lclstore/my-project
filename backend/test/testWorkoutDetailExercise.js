/**
 * 测试workout详情查询中的exerciseList完整信息
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

// 测试创建包含动作的workout
async function createTestWorkout() {
    try {
        console.log('🔍 创建测试workout...');
        
        const testData = {
            name: "测试动作详情的训练",
            description: "用于测试exerciseList返回完整信息",
            premium: 0,
            genderCode: "MALE",
            difficultyCode: "BEGINNER",
            positionCode: "STANDING",
            injuredCodes: ["NONE"],
            calorie: 300,
            duration: 1800,
            status: "ENABLED",
            exerciseGroupList: [
                {
                    structureName: "热身阶段",
                    structureRound: 1,
                    exerciseList: [1, 2] // 假设这些exercise ID存在
                },
                {
                    structureName: "主要训练",
                    structureRound: 3,
                    exerciseList: [3, 4, 5] // 假设这些exercise ID存在
                }
            ]
        };
        
        const response = await api.post('/workout/save', testData);
        
        if (response.data.success) {
            console.log('✅ 创建测试workout成功');
            console.log(`   workout ID: ${response.data.data.id}`);
            return response.data.data.id;
        } else {
            console.log('❌ 创建测试workout失败:', response.data.errMessage);
            return null;
        }
    } catch (error) {
        console.error('❌ 创建测试workout请求失败:', error.response?.data || error.message);
        return null;
    }
}

// 测试查询workout详情中的exerciseList
async function testWorkoutDetailExerciseList(workoutId) {
    try {
        console.log('\n🔍 测试查询workout详情中的exerciseList...');
        
        const response = await api.get(`/workout/detail/${workoutId}`);
        
        if (response.data.success) {
            console.log('✅ 查询workout详情成功');
            
            const workoutData = response.data.data;
            console.log(`   workout名称: ${workoutData.name}`);
            console.log(`   动作组数量: ${workoutData.exerciseGroupList?.length || 0}`);
            
            if (workoutData.exerciseGroupList && workoutData.exerciseGroupList.length > 0) {
                workoutData.exerciseGroupList.forEach((group, groupIndex) => {
                    console.log(`\n   动作组 ${groupIndex + 1}:`);
                    console.log(`     组名: ${group.structureName}`);
                    console.log(`     轮数: ${group.structureRound}`);
                    console.log(`     动作数量: ${group.exerciseList?.length || 0}`);
                    
                    if (group.exerciseList && group.exerciseList.length > 0) {
                        group.exerciseList.forEach((exercise, exerciseIndex) => {
                            console.log(`\n     动作 ${exerciseIndex + 1}:`);
                            
                            // 检查是否返回了完整的动作信息
                            if (typeof exercise === 'object' && exercise.id) {
                                console.log(`       ID: ${exercise.id}`);
                                console.log(`       名称: ${exercise.name || 'N/A'}`);
                                console.log(`       描述: ${exercise.description || 'N/A'}`);
                                console.log(`       时长: ${exercise.duration || 'N/A'}`);
                                console.log(`       卡路里: ${exercise.calorie || 'N/A'}`);
                                console.log(`       难度: ${exercise.difficultyCode || 'N/A'}`);
                                console.log(`       性别: ${exercise.genderCode || 'N/A'}`);
                                console.log(`       部位: ${exercise.positionCode || 'N/A'}`);
                                console.log(`       状态: ${exercise.status || 'N/A'}`);
                                console.log(`       封面图: ${exercise.coverImgUrl ? '有' : '无'}`);
                                console.log(`       视频: ${exercise.videoUrl ? '有' : '无'}`);
                                console.log(`       音频: ${exercise.audioUrl ? '有' : '无'}`);
                                
                                // 验证字段完整性
                                const requiredFields = ['id', 'name'];
                                const optionalFields = ['description', 'coverImgUrl', 'detailImgUrl', 
                                                      'thumbnailImgUrl', 'videoUrl', 'audioUrl', 
                                                      'duration', 'calorie', 'difficultyCode', 
                                                      'genderCode', 'positionCode', 'status'];
                                
                                const missingRequired = requiredFields.filter(field => !exercise.hasOwnProperty(field));
                                const presentOptional = optionalFields.filter(field => exercise.hasOwnProperty(field));
                                
                                if (missingRequired.length === 0) {
                                    console.log(`       ✅ 必需字段完整`);
                                } else {
                                    console.log(`       ❌ 缺少必需字段: ${missingRequired.join(', ')}`);
                                }
                                
                                console.log(`       📋 包含可选字段: ${presentOptional.length}/${optionalFields.length}`);
                                
                            } else if (typeof exercise === 'number') {
                                console.log(`       ❌ 仍然只返回ID: ${exercise}`);
                            } else {
                                console.log(`       ❌ 未知格式: ${typeof exercise}`);
                            }
                        });
                    } else {
                        console.log(`     ⚠️  该组没有动作`);
                    }
                });
                
                return true;
            } else {
                console.log('   ⚠️  没有动作组数据');
                return false;
            }
        } else {
            console.log('❌ 查询workout详情失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 查询workout详情请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 验证数据格式
async function validateExerciseListFormat(workoutId) {
    try {
        console.log('\n🔍 验证exerciseList数据格式...');
        
        const response = await api.get(`/workout/detail/${workoutId}`);
        
        if (response.data.success && response.data.data.exerciseGroupList) {
            let allValid = true;
            let totalExercises = 0;
            let validExercises = 0;
            
            response.data.data.exerciseGroupList.forEach(group => {
                if (group.exerciseList) {
                    group.exerciseList.forEach(exercise => {
                        totalExercises++;
                        
                        if (typeof exercise === 'object' && exercise.id && exercise.name) {
                            validExercises++;
                        } else {
                            allValid = false;
                        }
                    });
                }
            });
            
            console.log(`   总动作数: ${totalExercises}`);
            console.log(`   有效动作数: ${validExercises}`);
            console.log(`   格式验证: ${allValid ? '✅ 通过' : '❌ 失败'}`);
            
            return allValid;
        } else {
            console.log('   ❌ 无法获取数据进行验证');
            return false;
        }
    } catch (error) {
        console.error('❌ 验证数据格式失败:', error.response?.data || error.message);
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
    console.log('🚀 开始测试workout详情中的exerciseList完整信息\n');
    
    try {
        // 1. 创建测试workout
        const workoutId = await createTestWorkout();
        if (!workoutId) {
            console.log('💥 创建测试workout失败，终止测试');
            return;
        }
        
        // 2. 测试查询详情中的exerciseList
        const detailTest = await testWorkoutDetailExerciseList(workoutId);
        
        // 3. 验证数据格式
        const formatTest = await validateExerciseListFormat(workoutId);
        
        // 4. 清理测试数据
        await cleanupTestData(workoutId);
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   详情查询: ${detailTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   格式验证: ${formatTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   总体结果: ${detailTest && formatTest ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        console.log('\n✅ exerciseList完整信息测试完成');
        
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
    createTestWorkout,
    testWorkoutDetailExerciseList,
    validateExerciseListFormat
};
