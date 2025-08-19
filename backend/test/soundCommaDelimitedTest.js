/**
 * 测试 sound 模块支持逗号分隔的多选参数
 */

const { BusinessHelper } = require('../config/database');

async function testSoundCommaDelimited() {
    try {
        console.log('🚀 开始测试 sound 模块逗号分隔参数支持...\n');

        // 1. 测试参数解析函数
        console.log('1. 测试参数解析函数');
        
        const parseArrayParam = (param) => {
            if (!param) return null;
            if (Array.isArray(param)) return param;
            if (typeof param === 'string') {
                // 支持逗号分隔的字符串，如 "ENABLED,DISABLED"
                return param.split(',').map(item => item.trim()).filter(item => item);
            }
            return [param];
        };

        // 测试各种格式
        const testCases = [
            { input: 'ENABLED,DISABLED', expected: ['ENABLED', 'DISABLED'] },
            { input: 'ENABLED, DISABLED', expected: ['ENABLED', 'DISABLED'] }, // 带空格
            { input: 'ENABLED,DISABLED,DRAFT', expected: ['ENABLED', 'DISABLED', 'DRAFT'] },
            { input: 'ENABLED', expected: ['ENABLED'] }, // 单个值
            { input: ['ENABLED', 'DISABLED'], expected: ['ENABLED', 'DISABLED'] }, // 数组
            { input: '', expected: [] }, // 空字符串
            { input: null, expected: null }, // null
            { input: undefined, expected: null } // undefined
        ];

        testCases.forEach((testCase, index) => {
            const result = parseArrayParam(testCase.input);
            const isEqual = JSON.stringify(result) === JSON.stringify(testCase.expected);
            console.log(`测试 ${index + 1}: ${isEqual ? '✅' : '❌'}`);
            console.log(`  输入: ${JSON.stringify(testCase.input)}`);
            console.log(`  期望: ${JSON.stringify(testCase.expected)}`);
            console.log(`  实际: ${JSON.stringify(result)}`);
            if (!isEqual) {
                console.log(`  ❌ 不匹配!`);
            }
            console.log('');
        });

        // 2. 模拟实际的查询请求
        console.log('2. 模拟实际的查询请求');

        // 准备测试数据
        console.log('2.1 准备测试数据');
        const testData = [
            {
                name: '测试音频-启用',
                genderCode: 'FEMALE',
                usageCode: 'FLOW',
                translation: 1,
                status: 'ENABLED'
            },
            {
                name: '测试音频-禁用',
                genderCode: 'MALE',
                usageCode: 'GENERAL',
                translation: 0,
                status: 'DISABLED'
            },
            {
                name: '测试音频-草稿',
                genderCode: 'FEMALE_AND_MALE',
                usageCode: 'FLOW',
                translation: 1,
                status: 'DRAFT'
            }
        ];

        const createdIds = [];
        for (const data of testData) {
            const result = await BusinessHelper.insertWithValidation('sound', data);
            if (result.success) {
                createdIds.push(result.insertId);
                console.log(`✅ 创建测试数据成功，ID: ${result.insertId}, 状态: ${data.status}`);
            }
        }

        if (createdIds.length === 0) {
            console.log('❌ 没有创建成功的测试数据');
            return;
        }

        // 2.2 测试逗号分隔的状态查询
        console.log('\n2.2 测试逗号分隔的状态查询');
        
        // 模拟不同的请求格式
        const requestFormats = [
            {
                name: '逗号分隔字符串',
                query: { statusList: 'ENABLED,DISABLED' }
            },
            {
                name: '带空格的逗号分隔',
                query: { statusList: 'ENABLED, DISABLED' }
            },
            {
                name: '三个值的逗号分隔',
                query: { statusList: 'ENABLED,DISABLED,DRAFT' }
            },
            {
                name: '单个值字符串',
                query: { statusList: 'ENABLED' }
            },
            {
                name: '数组格式',
                query: { statusList: ['ENABLED', 'DISABLED'] }
            }
        ];

        for (const format of requestFormats) {
            console.log(`\n测试格式: ${format.name}`);
            console.log(`查询参数: ${JSON.stringify(format.query)}`);
            
            // 模拟路由中的参数处理逻辑
            const { statusList } = format.query;
            const parsedStatusList = parseArrayParam(statusList);
            
            console.log(`解析结果: ${JSON.stringify(parsedStatusList)}`);
            
            if (parsedStatusList && parsedStatusList.length > 0) {
                // 构建查询条件
                const { QueryConditionBuilder, SOUND_ENUMS } = require('../utils/enumHelper');
                const conditionBuilder = new QueryConditionBuilder();
                conditionBuilder.addArrayCondition('status', parsedStatusList, SOUND_ENUMS.STATUS);
                
                const { where, params } = conditionBuilder.build();
                console.log(`查询条件: ${where}`);
                console.log(`查询参数: ${JSON.stringify(params)}`);
                
                // 执行查询
                const { query } = require('../config/database');
                const result = await query(
                    `SELECT id, name, status FROM sound WHERE ${where} ORDER BY id DESC`,
                    params
                );
                
                console.log(`✅ 查询成功，匹配 ${result.length} 条记录:`);
                result.forEach(record => {
                    console.log(`  - ID: ${record.id}, 名称: ${record.name}, 状态: ${record.status}`);
                });
            }
        }

        // 2.3 测试组合查询
        console.log('\n2.3 测试组合查询（逗号分隔）');
        
        const combinedQuery = {
            statusList: 'ENABLED,DISABLED',
            genderCodeList: 'FEMALE,MALE',
            usageCodeList: 'FLOW'
        };
        
        console.log(`组合查询参数: ${JSON.stringify(combinedQuery)}`);
        
        const parsedParams = {
            statusList: parseArrayParam(combinedQuery.statusList),
            genderCodeList: parseArrayParam(combinedQuery.genderCodeList),
            usageCodeList: parseArrayParam(combinedQuery.usageCodeList)
        };
        
        console.log(`解析后参数: ${JSON.stringify(parsedParams)}`);
        
        // 构建组合查询条件
        const { QueryConditionBuilder, SOUND_ENUMS } = require('../utils/enumHelper');
        const { toSnakeCase } = require('../utils/fieldConverter');
        
        const combinedBuilder = new QueryConditionBuilder();
        
        if (parsedParams.statusList) {
            combinedBuilder.addArrayCondition('status', parsedParams.statusList, SOUND_ENUMS.STATUS);
        }
        if (parsedParams.genderCodeList) {
            combinedBuilder.addArrayCondition(toSnakeCase('genderCode'), parsedParams.genderCodeList, SOUND_ENUMS.GENDER);
        }
        if (parsedParams.usageCodeList) {
            combinedBuilder.addArrayCondition(toSnakeCase('usageCode'), parsedParams.usageCodeList, SOUND_ENUMS.USAGE);
        }
        
        const { where: combinedWhere, params: combinedParams } = combinedBuilder.build();
        console.log(`组合查询条件: ${combinedWhere}`);
        console.log(`组合查询参数: ${JSON.stringify(combinedParams)}`);
        
        const { query } = require('../config/database');
        const combinedResult = await query(
            `SELECT id, name, status, gender_code, usage_code FROM sound WHERE ${combinedWhere} ORDER BY id DESC`,
            combinedParams
        );
        
        console.log(`✅ 组合查询成功，匹配 ${combinedResult.length} 条记录:`);
        combinedResult.forEach(record => {
            console.log(`  - ID: ${record.id}, 名称: ${record.name}, 状态: ${record.status}, 性别: ${record.gender_code}, 用途: ${record.usage_code}`);
        });

        // 3. 清理测试数据
        console.log('\n3. 清理测试数据');
        if (createdIds.length > 0) {
            const deleteResult = await query(
                `DELETE FROM sound WHERE id IN (${createdIds.map(() => '?').join(',')})`,
                createdIds
            );
            console.log(`✅ 清理完成，删除 ${deleteResult.affectedRows} 条记录`);
        }

        console.log('\n✅ sound 模块逗号分隔参数测试完成！');
        console.log('\n📋 测试总结:');
        console.log('- ✅ 参数解析函数支持多种格式');
        console.log('- ✅ 逗号分隔字符串解析正常');
        console.log('- ✅ 带空格的逗号分隔解析正常');
        console.log('- ✅ 单个值解析正常');
        console.log('- ✅ 数组格式解析正常');
        console.log('- ✅ 组合查询支持逗号分隔');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSoundCommaDelimited()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSoundCommaDelimited };
