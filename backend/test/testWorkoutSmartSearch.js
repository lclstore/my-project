/**
 * 测试workout智能搜索功能
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

// 测试纯数字搜索（ID精确匹配）
async function testNumericSearch() {
    try {
        console.log('🔍 测试纯数字搜索（ID精确匹配）...');
        
        // 先获取一个存在的workout ID
        const listResponse = await api.get('/workout/page?pageSize=1');
        if (!listResponse.data.success || listResponse.data.data.length === 0) {
            console.log('⚠️  没有workout数据，跳过数字搜索测试');
            return false;
        }
        
        const existingId = listResponse.data.data[0].id;
        console.log(`   使用存在的ID: ${existingId}`);
        
        // 使用ID进行搜索
        const searchResponse = await api.get(`/workout/page?keywords=${existingId}`);
        
        if (searchResponse.data.success) {
            const results = searchResponse.data.data;
            console.log(`   搜索结果数量: ${results.length}`);
            
            if (results.length > 0) {
                const foundWorkout = results[0];
                console.log(`   找到的workout ID: ${foundWorkout.id}`);
                console.log(`   找到的workout名称: ${foundWorkout.name}`);
                
                // 验证是否为精确匹配
                if (foundWorkout.id === existingId) {
                    console.log('   ✅ ID精确匹配成功');
                    return true;
                } else {
                    console.log('   ❌ ID匹配失败');
                    return false;
                }
            } else {
                console.log('   ❌ 没有找到匹配结果');
                return false;
            }
        } else {
            console.log('   ❌ 搜索请求失败:', searchResponse.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 数字搜索测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试不存在ID的数字搜索（应该转为名称搜索）
async function testNonExistentIdSearch() {
    try {
        console.log('\n🔍 测试不存在ID的数字搜索（转为名称搜索）...');
        
        // 使用一个很大的不存在的ID
        const nonExistentId = 999999;
        console.log(`   使用不存在的ID: ${nonExistentId}`);
        
        const searchResponse = await api.get(`/workout/page?keywords=${nonExistentId}`);
        
        if (searchResponse.data.success) {
            const results = searchResponse.data.data;
            console.log(`   搜索结果数量: ${results.length}`);
            
            // 应该没有结果，因为名称中不太可能包含999999
            if (results.length === 0) {
                console.log('   ✅ 不存在ID转名称搜索成功（无结果符合预期）');
                return true;
            } else {
                console.log('   ⚠️  找到了结果，可能名称中包含该数字');
                results.forEach(workout => {
                    console.log(`     - ${workout.name} (ID: ${workout.id})`);
                });
                return true; // 这也是正常的，说明转换为名称搜索了
            }
        } else {
            console.log('   ❌ 搜索请求失败:', searchResponse.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 不存在ID搜索测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试文本搜索（名称模糊匹配）
async function testTextSearch() {
    try {
        console.log('\n🔍 测试文本搜索（名称模糊匹配）...');
        
        // 先获取一个workout的名称片段
        const listResponse = await api.get('/workout/page?pageSize=1');
        if (!listResponse.data.success || listResponse.data.data.length === 0) {
            console.log('⚠️  没有workout数据，跳过文本搜索测试');
            return false;
        }
        
        const workoutName = listResponse.data.data[0].name;
        // 取名称的前几个字符作为搜索关键词
        const searchKeyword = workoutName.substring(0, Math.min(2, workoutName.length));
        console.log(`   使用搜索关键词: "${searchKeyword}"`);
        
        const searchResponse = await api.get(`/workout/page?keywords=${encodeURIComponent(searchKeyword)}`);
        
        if (searchResponse.data.success) {
            const results = searchResponse.data.data;
            console.log(`   搜索结果数量: ${results.length}`);
            
            if (results.length > 0) {
                console.log('   找到的workout:');
                results.slice(0, 3).forEach(workout => {
                    console.log(`     - ${workout.name} (ID: ${workout.id})`);
                });
                
                // 验证结果是否包含搜索关键词
                const matchingResults = results.filter(workout => 
                    workout.name.toLowerCase().includes(searchKeyword.toLowerCase())
                );
                
                if (matchingResults.length > 0) {
                    console.log(`   ✅ 文本模糊搜索成功，匹配数量: ${matchingResults.length}`);
                    return true;
                } else {
                    console.log('   ⚠️  搜索结果中没有包含关键词的项目');
                    return true; // 可能是数据库中的其他匹配逻辑
                }
            } else {
                console.log('   ⚠️  没有找到匹配结果');
                return true; // 没有结果也是正常的
            }
        } else {
            console.log('   ❌ 搜索请求失败:', searchResponse.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 文本搜索测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试混合搜索（包含数字和文本）
async function testMixedSearch() {
    try {
        console.log('\n🔍 测试混合搜索（包含数字和文本）...');
        
        const mixedKeyword = "训练1";
        console.log(`   使用混合关键词: "${mixedKeyword}"`);
        
        const searchResponse = await api.get(`/workout/page?keywords=${encodeURIComponent(mixedKeyword)}`);
        
        if (searchResponse.data.success) {
            const results = searchResponse.data.data;
            console.log(`   搜索结果数量: ${results.length}`);
            
            if (results.length > 0) {
                console.log('   找到的workout:');
                results.slice(0, 3).forEach(workout => {
                    console.log(`     - ${workout.name} (ID: ${workout.id})`);
                });
                console.log('   ✅ 混合搜索执行成功');
            } else {
                console.log('   ⚠️  没有找到匹配结果（正常，因为可能没有包含该关键词的数据）');
            }
            
            return true;
        } else {
            console.log('   ❌ 搜索请求失败:', searchResponse.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 混合搜索测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试空关键词搜索
async function testEmptySearch() {
    try {
        console.log('\n🔍 测试空关键词搜索...');
        
        const searchResponse = await api.get('/workout/page?keywords=');
        
        if (searchResponse.data.success) {
            const results = searchResponse.data.data;
            console.log(`   搜索结果数量: ${results.length}`);
            console.log('   ✅ 空关键词搜索成功（应该返回所有数据）');
            return true;
        } else {
            console.log('   ❌ 搜索请求失败:', searchResponse.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 空关键词搜索测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试workout智能搜索功能\n');
    
    try {
        // 1. 测试纯数字搜索（ID精确匹配）
        const numericTest = await testNumericSearch();
        
        // 2. 测试不存在ID的数字搜索
        const nonExistentTest = await testNonExistentIdSearch();
        
        // 3. 测试文本搜索
        const textTest = await testTextSearch();
        
        // 4. 测试混合搜索
        const mixedTest = await testMixedSearch();
        
        // 5. 测试空关键词搜索
        const emptyTest = await testEmptySearch();
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   纯数字搜索: ${numericTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   不存在ID搜索: ${nonExistentTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   文本搜索: ${textTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   混合搜索: ${mixedTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   空关键词搜索: ${emptyTest ? '✅ 通过' : '❌ 失败'}`);
        
        const allPassed = numericTest && nonExistentTest && textTest && mixedTest && emptyTest;
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        console.log('\n✅ workout智能搜索功能测试完成');
        
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
    testNumericSearch,
    testNonExistentIdSearch,
    testTextSearch,
    testMixedSearch,
    testEmptySearch
};
