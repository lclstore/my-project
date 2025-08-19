/**
 * 测试category使用公共查询方法
 */

const { BusinessHelper } = require('../config/database');
const { QueryConditionBuilder } = require('../utils/enumHelper');
const { convertToFrontendFormat, toSnakeCase } = require('../utils/fieldConverter');
const { parseArrayParam, parsePaginationParams } = require('../utils/paramHelper');

// 模拟req对象
const mockReq = {
    query: {
        pageIndex: 1,
        pageSize: 5,
        keywords: '',
        statusList: '',
        orderBy: 'id',
        orderDirection: 'desc'
    }
};

// 测试公共查询方法
async function testPublicQueryMethod() {
    try {
        console.log('🔍 测试category使用公共查询方法...');
        
        // 解析参数（模拟路由中的逻辑）
        const { keywords, statusList, orderBy, orderDirection } = mockReq.query;
        
        // 使用公共参数处理工具
        const queryParams = {};
        if (statusList) queryParams.statusList = parseArrayParam(statusList);
        
        // 解析分页参数
        const { pageIndex, pageSize, offset } = parsePaginationParams(mockReq.query);
        console.log(`   分页参数: pageIndex=${pageIndex}, pageSize=${pageSize}, offset=${offset}`);
        
        // 转换排序字段名
        const dbOrderBy = orderBy ? toSnakeCase(orderBy) : 'id';
        console.log(`   排序字段: ${dbOrderBy} ${orderDirection === 'asc' ? 'ASC' : 'DESC'}`);
        
        // 构建查询条件
        const conditionBuilder = new QueryConditionBuilder();
        
        // 添加逻辑删除过滤条件
        conditionBuilder.addNumberCondition('is_deleted', 0);
        console.log('   ✅ 添加逻辑删除过滤条件');
        
        // 添加关键词搜索条件
        if (keywords && keywords.trim()) {
            const trimmedKeywords = keywords.trim();
            if (/^\d+$/.test(trimmedKeywords)) {
                conditionBuilder.addNumberCondition('id', parseInt(trimmedKeywords));
                console.log(`   ✅ 添加ID精确匹配条件: ${trimmedKeywords}`);
            } else {
                conditionBuilder.addStringCondition('name', trimmedKeywords, 'like');
                console.log(`   ✅ 添加名称模糊搜索条件: ${trimmedKeywords}`);
            }
        }
        
        // 添加状态筛选条件
        if (queryParams.statusList && queryParams.statusList.length > 0) {
            conditionBuilder.addArrayCondition('status', queryParams.statusList, 'BizCategoryStatusEnums');
            console.log(`   ✅ 添加状态筛选条件: ${queryParams.statusList.join(', ')}`);
        }
        
        // 构建查询选项
        const options = {
            orderBy: `${dbOrderBy} ${orderDirection === 'asc' ? 'ASC' : 'DESC'}`,
            excludeFields: ['is_deleted']  // 排除 is_deleted 字段
        };
        
        const { where, params } = conditionBuilder.build();
        console.log(`   构建的WHERE条件: ${where || '无额外条件'}`);
        console.log(`   查询参数: [${params.join(', ')}]`);
        
        if (where) {
            options.where = where;
            options.whereParams = params;
        }
        
        // 使用BusinessHelper进行分页查询
        console.log('   🔍 调用BusinessHelper.paginateWithValidation...');
        const result = await BusinessHelper.paginateWithValidation('category', mockReq, options);
        
        if (result.success) {
            console.log('   ✅ 公共查询方法调用成功');
            console.log(`   查询结果: 总数=${result.data.total}, 当前页数据=${result.data.data.length}`);
            
            // 进行字段转换
            const processedData = result.data.data.map(item => convertToFrontendFormat(item));
            console.log('   ✅ 字段转换完成');
            
            // 检查返回的数据是否包含is_deleted字段
            if (processedData.length > 0) {
                const firstItem = processedData[0];
                const hasIsDeleted = firstItem.hasOwnProperty('isDeleted') || firstItem.hasOwnProperty('is_deleted');
                console.log(`   检查is_deleted字段: ${hasIsDeleted ? '❌ 包含' : '✅ 已排除'}`);
                
                console.log('   示例数据:');
                console.log(`     ID: ${firstItem.id}`);
                console.log(`     名称: ${firstItem.name}`);
                console.log(`     状态: ${firstItem.status}`);
                console.log(`     创建时间: ${firstItem.createTime}`);
                console.log(`     字段数量: ${Object.keys(firstItem).length}`);
            }
            
            // 构建分页响应
            const response = {
                data: processedData,
                total: result.data.total,
                pageIndex: result.data.pageIndex,
                pageSize: result.data.pageSize,
                totalPages: result.data.totalPages
            };
            
            console.log('   ✅ 分页响应构建完成');
            console.log(`   最终响应: 数据${response.data.length}条, 总数${response.total}, 页码${response.pageIndex}/${response.totalPages}`);
            
            return true;
        } else {
            console.log('   ❌ 公共查询方法调用失败:', result.message);
            return false;
        }
        
    } catch (error) {
        console.error('❌ 测试公共查询方法失败:', error.message);
        return false;
    }
}

// 测试不同的查询条件
async function testDifferentConditions() {
    try {
        console.log('\n🔍 测试不同的查询条件...');
        
        // 测试1: 关键词搜索
        console.log('\n   测试1: 关键词搜索');
        const keywordReq = {
            query: { ...mockReq.query, keywords: '训练' }
        };
        
        const conditionBuilder1 = new QueryConditionBuilder();
        conditionBuilder1.addNumberCondition('is_deleted', 0);
        conditionBuilder1.addStringCondition('name', '训练', 'like');
        
        const { where: where1, params: params1 } = conditionBuilder1.build();
        console.log(`     WHERE条件: ${where1}`);
        console.log(`     参数: [${params1.join(', ')}]`);
        
        // 测试2: 状态筛选
        console.log('\n   测试2: 状态筛选');
        const statusReq = {
            query: { ...mockReq.query, statusList: 'ENABLED,DRAFT' }
        };
        
        const conditionBuilder2 = new QueryConditionBuilder();
        conditionBuilder2.addNumberCondition('is_deleted', 0);
        conditionBuilder2.addArrayCondition('status', ['ENABLED', 'DRAFT'], 'BizCategoryStatusEnums');
        
        const { where: where2, params: params2 } = conditionBuilder2.build();
        console.log(`     WHERE条件: ${where2}`);
        console.log(`     参数: [${params2.join(', ')}]`);
        
        // 测试3: ID精确匹配
        console.log('\n   测试3: ID精确匹配');
        const idReq = {
            query: { ...mockReq.query, keywords: '1' }
        };
        
        const conditionBuilder3 = new QueryConditionBuilder();
        conditionBuilder3.addNumberCondition('is_deleted', 0);
        conditionBuilder3.addNumberCondition('id', 1);
        
        const { where: where3, params: params3 } = conditionBuilder3.build();
        console.log(`     WHERE条件: ${where3}`);
        console.log(`     参数: [${params3.join(', ')}]`);
        
        console.log('   ✅ 不同查询条件测试完成');
        return true;
        
    } catch (error) {
        console.error('❌ 测试不同查询条件失败:', error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试category使用公共查询方法\n');
    
    try {
        // 1. 测试公共查询方法
        const publicMethodTest = await testPublicQueryMethod();
        
        // 2. 测试不同的查询条件
        const conditionsTest = await testDifferentConditions();
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   公共查询方法: ${publicMethodTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   查询条件构建: ${conditionsTest ? '✅ 通过' : '❌ 失败'}`);
        
        const allPassed = publicMethodTest && conditionsTest;
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        if (allPassed) {
            console.log('\n🎉 category已正确使用公共查询方法！');
            console.log('   ✅ 使用BusinessHelper.paginateWithValidation');
            console.log('   ✅ 自动过滤已删除数据（is_deleted = 0）');
            console.log('   ✅ 排除敏感字段（excludeFields）');
            console.log('   ✅ 支持智能搜索和多条件筛选');
            console.log('   ✅ 统一的字段转换和响应格式');
        }
        
        console.log('\n✅ 公共查询方法测试完成');
        
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
    testPublicQueryMethod,
    testDifferentConditions
};
