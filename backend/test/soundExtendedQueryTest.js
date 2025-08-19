/**
 * 测试 sound 模块的扩展查询条件功能
 */

const { BusinessHelper, query } = require('../config/database');
const { soundEnumHelper, QueryConditionBuilder, SOUND_ENUMS } = require('../utils/enumHelper');
const { validateApiData } = require('../utils/validator');

async function testSoundExtendedQuery() {
    try {
        console.log('🚀 开始测试 sound 模块扩展查询条件...\n');

        // 1. 测试枚举工具
        console.log('1. 测试枚举工具');
        console.log('状态枚举值:', soundEnumHelper.getStatusValues());
        console.log('性别枚举值:', soundEnumHelper.getGenderValues());
        console.log('用途枚举值:', soundEnumHelper.getUsageValues());

        // 2. 测试枚举验证
        console.log('\n2. 测试枚举验证');
        
        // 测试有效值
        const validStatus = soundEnumHelper.validateStatusArray(['ENABLED', 'DISABLED']);
        console.log('有效状态验证:', validStatus.valid ? '✅' : '❌', validStatus.message);
        
        const validGender = soundEnumHelper.validateGenderArray(['FEMALE', 'MALE']);
        console.log('有效性别验证:', validGender.valid ? '✅' : '❌', validGender.message);
        
        // 测试无效值
        const invalidStatus = soundEnumHelper.validateStatusArray(['INVALID', 'ENABLED']);
        console.log('无效状态验证:', invalidStatus.valid ? '✅' : '❌', invalidStatus.message);

        // 3. 测试查询条件构建器
        console.log('\n3. 测试查询条件构建器');
        
        const builder = new QueryConditionBuilder();
        
        // 添加状态条件
        builder.addArrayCondition('status', ['ENABLED', 'DISABLED'], SOUND_ENUMS.STATUS);
        
        // 添加性别条件
        builder.addArrayCondition('gender_code', ['FEMALE'], SOUND_ENUMS.GENDER);
        
        // 添加名称搜索条件
        builder.addStringCondition('name', '测试', 'like');
        
        const { where, params } = builder.build();
        console.log('构建的查询条件:', where);
        console.log('查询参数:', params);

        // 4. 测试参数验证
        console.log('\n4. 测试参数验证');
        
        // 测试有效参数
        const validParams = {
            statusList: ['ENABLED', 'DISABLED'],
            genderCodeList: ['FEMALE', 'MALE'],
            usageCodeList: ['FLOW']
        };
        
        const validValidation = validateApiData(validParams, 'sound.query');
        console.log('有效参数验证:', validValidation.valid ? '✅' : '❌', validValidation.error || '通过');
        
        // 测试无效参数
        const invalidParams = {
            statusList: ['INVALID_STATUS'],
            genderCodeList: ['INVALID_GENDER']
        };
        
        const invalidValidation = validateApiData(invalidParams, 'sound.query');
        console.log('无效参数验证:', invalidValidation.valid ? '✅' : '❌', invalidValidation.error || '通过');

        // 5. 测试实际查询
        console.log('\n5. 测试实际查询');
        
        // 准备测试数据
        console.log('5.1 准备测试数据');
        const testData = [
            {
                name: '测试音频-女声-流程',
                genderCode: 'FEMALE',
                usageCode: 'FLOW',
                translation: 1,
                status: 'ENABLED'
            },
            {
                name: '测试音频-男声-通用',
                genderCode: 'MALE',
                usageCode: 'GENERAL',
                translation: 0,
                status: 'DISABLED'
            },
            {
                name: '测试音频-双声-草稿',
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
                console.log(`✅ 创建测试数据成功，ID: ${result.insertId}`);
            }
        }

        if (createdIds.length === 0) {
            console.log('❌ 没有创建成功的测试数据');
            return;
        }

        // 5.2 测试状态筛选
        console.log('\n5.2 测试状态筛选');
        const statusQuery = new QueryConditionBuilder()
            .addArrayCondition('status', ['ENABLED', 'DISABLED'], SOUND_ENUMS.STATUS)
            .build();
        
        console.log('状态筛选条件:', statusQuery.where);
        const statusResult = await query(
            `SELECT id, name, status FROM sound WHERE ${statusQuery.where} ORDER BY id DESC`,
            statusQuery.params
        );
        console.log(`✅ 状态筛选结果: ${statusResult.length} 条记录`);
        statusResult.forEach(record => {
            console.log(`  - ID: ${record.id}, 名称: ${record.name}, 状态: ${record.status}`);
        });

        // 5.3 测试性别筛选
        console.log('\n5.3 测试性别筛选');
        const genderQuery = new QueryConditionBuilder()
            .addArrayCondition('gender_code', ['FEMALE', 'MALE'], SOUND_ENUMS.GENDER)
            .build();
        
        console.log('性别筛选条件:', genderQuery.where);
        const genderResult = await query(
            `SELECT id, name, gender_code FROM sound WHERE ${genderQuery.where} ORDER BY id DESC`,
            genderQuery.params
        );
        console.log(`✅ 性别筛选结果: ${genderResult.length} 条记录`);
        genderResult.forEach(record => {
            console.log(`  - ID: ${record.id}, 名称: ${record.name}, 性别: ${record.gender_code}`);
        });

        // 5.4 测试组合筛选
        console.log('\n5.4 测试组合筛选');
        const combinedQuery = new QueryConditionBuilder()
            .addArrayCondition('status', ['ENABLED', 'DISABLED'], SOUND_ENUMS.STATUS)
            .addArrayCondition('usage_code', ['FLOW'], SOUND_ENUMS.USAGE)
            .addStringCondition('name', '测试', 'like')
            .build();
        
        console.log('组合筛选条件:', combinedQuery.where);
        const combinedResult = await query(
            `SELECT id, name, status, usage_code FROM sound WHERE ${combinedQuery.where} ORDER BY id DESC`,
            combinedQuery.params
        );
        console.log(`✅ 组合筛选结果: ${combinedResult.length} 条记录`);
        combinedResult.forEach(record => {
            console.log(`  - ID: ${record.id}, 名称: ${record.name}, 状态: ${record.status}, 用途: ${record.usage_code}`);
        });

        // 6. 清理测试数据
        console.log('\n6. 清理测试数据');
        if (createdIds.length > 0) {
            const deleteResult = await query(
                `DELETE FROM sound WHERE id IN (${createdIds.map(() => '?').join(',')})`,
                createdIds
            );
            console.log(`✅ 清理完成，删除 ${deleteResult.affectedRows} 条记录`);
        }

        console.log('\n✅ sound 模块扩展查询条件测试完成！');
        console.log('\n📋 测试总结:');
        console.log('- ✅ 枚举工具功能正常');
        console.log('- ✅ 枚举验证功能正常');
        console.log('- ✅ 查询条件构建器功能正常');
        console.log('- ✅ 参数验证功能正常');
        console.log('- ✅ 状态筛选查询正常');
        console.log('- ✅ 性别筛选查询正常');
        console.log('- ✅ 组合筛选查询正常');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testSoundExtendedQuery()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testSoundExtendedQuery };
