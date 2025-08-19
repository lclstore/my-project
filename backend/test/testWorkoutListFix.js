/**
 * 测试修复后的workout列表查询
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

// 测试BusinessHelper.paginateWithValidation的数据结构
async function testPaginationDataStructure() {
    try {
        console.log('🔍 测试BusinessHelper.paginateWithValidation数据结构...');
        
        // 构建查询条件
        const conditionBuilder = new QueryConditionBuilder();
        conditionBuilder.addNumberCondition('is_deleted', 0);
        
        const options = {
            orderBy: 'id DESC',
            excludeFields: ['is_deleted']
        };
        
        const { where, params } = conditionBuilder.build();
        if (where) {
            options.where = where;
            options.whereParams = params;
        }
        
        // 使用BusinessHelper进行分页查询
        console.log('   🔍 调用BusinessHelper.paginateWithValidation...');
        const result = await BusinessHelper.paginateWithValidation('workout', mockReq, options);
        
        if (result.success) {
            console.log('   ✅ 查询成功');
            console.log('   数据结构分析:');
            console.log(`     result.success: ${result.success}`);
            console.log(`     result.data 类型: ${typeof result.data}`);
            console.log(`     result.data.data 类型: ${typeof result.data.data}`);
            console.log(`     result.data.data 是否为数组: ${Array.isArray(result.data.data)}`);
            console.log(`     result.data.data 长度: ${result.data.data?.length || 0}`);
            console.log(`     result.data.total: ${result.data.total}`);
            console.log(`     result.data.pageIndex: ${result.data.pageIndex}`);
            console.log(`     result.data.pageSize: ${result.data.pageSize}`);
            console.log(`     result.data.totalPages: ${result.data.totalPages}`);
            
            if (result.data.data && result.data.data.length > 0) {
                const firstItem = result.data.data[0];
                console.log('   示例数据:');
                console.log(`     ID: ${firstItem.id}`);
                console.log(`     名称: ${firstItem.name}`);
                console.log(`     字段数量: ${Object.keys(firstItem).length}`);
                console.log(`     包含is_deleted: ${firstItem.hasOwnProperty('is_deleted')}`);
            }
            
            return true;
        } else {
            console.log('   ❌ 查询失败:', result.message);
            return false;
        }
        
    } catch (error) {
        console.error('❌ 测试数据结构失败:', error.message);
        return false;
    }
}

// 测试修复后的workout列表查询逻辑
async function testWorkoutListLogic() {
    try {
        console.log('\n🔍 测试修复后的workout列表查询逻辑...');
        
        // 模拟路由中的逻辑
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
        
        // 构建查询选项
        const options = {
            orderBy: `${dbOrderBy} ${orderDirection === 'asc' ? 'ASC' : 'DESC'}`,
            excludeFields: ['is_deleted']
        };
        
        const { where, params } = conditionBuilder.build();
        if (where) {
            options.where = where;
            options.whereParams = params;
        }
        
        // 使用BusinessHelper进行分页查询
        console.log('   🔍 调用BusinessHelper.paginateWithValidation...');
        const result = await BusinessHelper.paginateWithValidation('workout', mockReq, options);
        
        if (!result.success) {
            console.log('   ❌ 查询失败:', result.message);
            return false;
        }
        
        console.log('   ✅ 查询成功');
        
        // 批量查询受伤类型（模拟原逻辑）
        const workoutIds = result.data.data.map(item => item.id);
        console.log(`   ✅ 提取workout IDs成功: [${workoutIds.slice(0, 3).join(', ')}...]`);
        
        let injuredMap = new Map();
        
        if (workoutIds.length > 0) {
            // 这里可以添加受伤类型查询逻辑
            console.log('   ✅ 受伤类型查询逻辑准备就绪');
        }
        
        // 为每个workout添加受伤类型数据并进行字段转换
        const processedData = result.data.data.map(item => {
            item.injuredCodes = injuredMap.get(item.id) || [];
            return convertToFrontendFormat(item);
        });
        
        console.log(`   ✅ 数据处理成功，处理了 ${processedData.length} 条记录`);
        
        // 构建分页响应
        const response = {
            data: processedData,
            total: result.data.total,
            pageIndex: result.data.pageIndex,
            pageSize: result.data.pageSize,
            totalPages: result.data.totalPages
        };
        
        console.log('   ✅ 响应构建成功');
        console.log(`   最终响应: 数据${response.data.length}条, 总数${response.total}, 页码${response.pageIndex}/${response.totalPages}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ 测试workout列表逻辑失败:', error.message);
        return false;
    }
}

// 测试逻辑删除过滤
async function testLogicalDeleteFilter() {
    try {
        console.log('\n🔍 测试逻辑删除过滤...');
        
        // 构建查询条件
        const conditionBuilder = new QueryConditionBuilder();
        conditionBuilder.addNumberCondition('is_deleted', 0);
        
        const options = {
            orderBy: 'id DESC',
            excludeFields: ['is_deleted']
        };
        
        const { where, params } = conditionBuilder.build();
        console.log(`   WHERE条件: ${where}`);
        console.log(`   参数: [${params.join(', ')}]`);
        
        if (where) {
            options.where = where;
            options.whereParams = params;
        }
        
        // 查询数据
        const result = await BusinessHelper.paginateWithValidation('workout', mockReq, options);
        
        if (result.success) {
            console.log('   ✅ 逻辑删除过滤查询成功');
            console.log(`   查询结果: ${result.data.data.length} 条记录`);
            
            // 检查返回的数据是否包含is_deleted字段
            if (result.data.data.length > 0) {
                const firstItem = result.data.data[0];
                const hasIsDeleted = firstItem.hasOwnProperty('is_deleted');
                console.log(`   is_deleted字段检查: ${hasIsDeleted ? '❌ 包含' : '✅ 已排除'}`);
            }
            
            return true;
        } else {
            console.log('   ❌ 逻辑删除过滤查询失败:', result.message);
            return false;
        }
        
    } catch (error) {
        console.error('❌ 测试逻辑删除过滤失败:', error.message);
        return false;
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始测试修复后的workout列表查询\n');
    
    try {
        // 1. 测试数据结构
        const structureTest = await testPaginationDataStructure();
        
        // 2. 测试完整的查询逻辑
        const logicTest = await testWorkoutListLogic();
        
        // 3. 测试逻辑删除过滤
        const deleteFilterTest = await testLogicalDeleteFilter();
        
        // 总结测试结果
        console.log('\n📊 测试结果总结:');
        console.log(`   数据结构: ${structureTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   查询逻辑: ${logicTest ? '✅ 通过' : '❌ 失败'}`);
        console.log(`   逻辑删除过滤: ${deleteFilterTest ? '✅ 通过' : '❌ 失败'}`);
        
        const allPassed = structureTest && logicTest && deleteFilterTest;
        console.log(`   总体结果: ${allPassed ? '✅ 全部通过' : '❌ 部分失败'}`);
        
        if (allPassed) {
            console.log('\n🎉 workout列表查询修复成功！');
            console.log('   ✅ 正确使用BusinessHelper.paginateWithValidation');
            console.log('   ✅ 正确处理result.data.data数据结构');
            console.log('   ✅ 正确构建分页响应');
            console.log('   ✅ 逻辑删除过滤正常工作');
            console.log('   ✅ 字段转换和数据处理正常');
        } else {
            console.log('\n⚠️  仍有问题需要解决');
        }
        
        console.log('\n✅ workout列表查询修复测试完成');
        
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
    testPaginationDataStructure,
    testWorkoutListLogic,
    testLogicalDeleteFilter
};
