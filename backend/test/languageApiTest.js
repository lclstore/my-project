/**
 * Language API接口测试
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

// 测试查询语言列表
async function testGetLanguageList() {
    try {
        console.log('🔍 测试查询语言列表...');
        
        const response = await api.get('/common/language/list');
        
        if (response.data.success) {
            console.log('✅ 查询语言列表成功');
            console.log(`   语言数量: ${response.data.data.length}`);
            
            // 显示前几个语言
            const languages = response.data.data.slice(0, 5);
            console.log('   前5个语言:');
            languages.forEach(lang => {
                console.log(`      ${lang.code} - ${lang.name}`);
            });
            
            // 验证字段转换
            const firstLang = response.data.data[0];
            if (firstLang) {
                console.log('   字段转换验证:');
                console.log(`      是否有createTime: ${firstLang.hasOwnProperty('createTime')}`);
                console.log(`      是否有create_time: ${firstLang.hasOwnProperty('create_time')}`);
            }
            
            return true;
        } else {
            console.log('❌ 查询语言列表失败:', response.data.errMessage);
            return false;
        }
    } catch (error) {
        console.error('❌ 查询语言列表请求失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试特定语言编码查询
async function testSpecificLanguage() {
    try {
        console.log('\n🔍 测试特定语言验证...');
        
        const response = await api.get('/common/language/list');
        
        if (response.data.success && response.data.data.length > 0) {
            const languages = response.data.data;
            
            // 验证常见语言是否存在
            const commonLanguages = ['zh-CN', 'en-US', 'ja-JP'];
            const foundLanguages = [];
            
            commonLanguages.forEach(code => {
                const found = languages.find(lang => lang.code === code);
                if (found) {
                    foundLanguages.push(`${found.code} - ${found.name}`);
                }
            });
            
            console.log(`✅ 找到常见语言: ${foundLanguages.length}/${commonLanguages.length}`);
            foundLanguages.forEach(lang => {
                console.log(`      ${lang}`);
            });
            
            return true;
        } else {
            console.log('❌ 无法获取语言数据进行验证');
            return false;
        }
    } catch (error) {
        console.error('❌ 特定语言验证失败:', error.response?.data || error.message);
        return false;
    }
}

// 测试响应格式
async function testResponseFormat() {
    try {
        console.log('\n🔍 测试响应格式...');
        
        const response = await api.get('/common/language/list');
        
        // 验证响应结构
        const requiredFields = ['success', 'data', 'message'];
        const missingFields = requiredFields.filter(field => !response.data.hasOwnProperty(field));
        
        if (missingFields.length === 0) {
            console.log('✅ 响应格式正确');
            console.log(`   success: ${response.data.success}`);
            console.log(`   message: ${response.data.message}`);
            console.log(`   data类型: ${Array.isArray(response.data.data) ? 'Array' : typeof response.data.data}`);
            
            // 验证数据项格式
            if (Array.isArray(response.data.data) && response.data.data.length > 0) {
                const firstItem = response.data.data[0];
                const itemFields = ['id', 'code', 'name', 'createTime'];
                const itemMissingFields = itemFields.filter(field => !firstItem.hasOwnProperty(field));
                
                if (itemMissingFields.length === 0) {
                    console.log('✅ 数据项格式正确');
                    console.log(`   包含字段: ${Object.keys(firstItem).join(', ')}`);
                } else {
                    console.log(`❌ 数据项缺少字段: ${itemMissingFields.join(', ')}`);
                }
            }
            
            return true;
        } else {
            console.log(`❌ 响应缺少字段: ${missingFields.join(', ')}`);
            return false;
        }
    } catch (error) {
        console.error('❌ 响应格式测试失败:', error.response?.data || error.message);
        return false;
    }
}

// 主测试函数
async function runApiTests() {
    console.log('🚀 开始Language API接口测试\n');
    
    try {
        // 1. 测试基本查询功能
        const basicTest = await testGetLanguageList();
        
        // 2. 测试特定语言验证
        const specificTest = await testSpecificLanguage();
        
        // 3. 测试响应格式
        const formatTest = await testResponseFormat();
        
        // 总结测试结果
        const allPassed = basicTest && specificTest && formatTest;
        
        console.log('\n📊 测试结果总结:');
        console.log(`   基本查询: ${basicTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   特定语言验证: ${specificTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   响应格式: ${formatTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        console.log('\n✅ Language API接口测试完成');
        
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
    testGetLanguageList,
    testSpecificLanguage,
    testResponseFormat
};
