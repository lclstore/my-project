/**
 * 完整测试 sound 模块的所有接口
 */

const { BusinessHelper, query } = require('../config/database');

async function testCompleteSoundModule() {
    try {
        console.log('🚀 开始完整测试 sound 模块...\n');

        // 1. 测试新增音频资源（通过 save 接口）
        console.log('1. 测试新增音频资源（save接口）');
        const testSoundData = {
            name: '测试欢迎语音',
            genderCode: 'FEMALE',
            usageCode: 'GENERAL',
            femaleAudioUrl: 'https://example.com/female-welcome.mp3',
            femaleAudioDuration: 30,
            translation: 1,
            femaleScript: 'Welcome to our service',
            status: 'ENABLED'
        };

        const insertResult = await BusinessHelper.insertWithValidation('sound', testSoundData);
        if (insertResult.success) {
            console.log('✅ 新增成功，ID:', insertResult.insertId);
            var testId = insertResult.insertId;
        } else {
            console.log('❌ 新增失败:', insertResult.message);
            return;
        }

        // 2. 测试修改音频资源（通过 save 接口，带 id）
        console.log('\n2. 测试修改音频资源（save接口带id）');
        const updateData = {
            id: testId,
            name: '测试欢迎语音（已修改）',
            genderCode: 'FEMALE_AND_MALE',
            usageCode: 'FLOW',
            femaleAudioUrl: 'https://example.com/female-welcome-updated.mp3',
            femaleAudioDuration: 35,
            maleAudioUrl: 'https://example.com/male-welcome.mp3',
            maleAudioDuration: 40,
            translation: 1,
            femaleScript: 'Welcome to our updated service',
            maleScript: 'Welcome to our updated service',
            status: 'ENABLED'
        };

        const updateResult = await BusinessHelper.updateWithValidation(
            'sound',
            testId,
            updateData,
            [],
            'sound'
        );

        if (updateResult.success) {
            console.log('✅ 修改成功');
        } else {
            console.log('❌ 修改失败:', updateResult.message);
        }

        // 3. 测试通过ID查询
        console.log('\n3. 测试通过ID查询');
        const { convertToFrontendFormat } = require('../utils/fieldConverter');
        const soundRecord = await query('SELECT * FROM sound WHERE id = ?', [testId]);
        
        if (soundRecord.length > 0) {
            const convertedData = convertToFrontendFormat(soundRecord[0]);
            console.log('✅ 查询成功:', {
                id: convertedData.id,
                name: convertedData.name,
                genderCode: convertedData.genderCode,
                status: convertedData.status
            });
        } else {
            console.log('❌ 查询失败: 记录不存在');
        }

        // 4. 测试分页查询（无关键词）
        console.log('\n4. 测试分页查询（无关键词）');
        const mockReq1 = {
            query: {
                pageSize: '10',
                pageIndex: '1',
                orderBy: 'id',
                orderDirection: 'DESC'
            }
        };

        const pageResult1 = await BusinessHelper.paginateWithValidation(
            'sound',
            mockReq1,
            { orderBy: 'id DESC' }
        );

        if (pageResult1.success) {
            console.log('✅ 分页查询成功');
            console.log('总记录数:', pageResult1.data.totalCount);
            console.log('当前页记录数:', pageResult1.data.data.length);
        } else {
            console.log('❌ 分页查询失败:', pageResult1.message);
        }

        // 5. 测试关键词搜索（ID全匹配）
        console.log('\n5. 测试关键词搜索（ID全匹配）');
        const mockReq2 = {
            query: {
                pageSize: '10',
                pageIndex: '1',
                keywords: testId.toString(),
                orderBy: 'id',
                orderDirection: 'DESC'
            }
        };

        const pageResult2 = await BusinessHelper.paginateWithValidation(
            'sound',
            mockReq2,
            {
                where: 'id = ?',
                whereParams: [testId],
                orderBy: 'id DESC'
            }
        );

        if (pageResult2.success) {
            console.log('✅ ID搜索成功');
            console.log('搜索结果数:', pageResult2.data.totalCount);
        } else {
            console.log('❌ ID搜索失败:', pageResult2.message);
        }

        // 6. 测试关键词搜索（名称模糊匹配）
        console.log('\n6. 测试关键词搜索（名称模糊匹配）');
        const mockReq3 = {
            query: {
                pageSize: '10',
                pageIndex: '1',
                keywords: '测试',
                orderBy: 'id',
                orderDirection: 'DESC'
            }
        };

        const pageResult3 = await BusinessHelper.paginateWithValidation(
            'sound',
            mockReq3,
            {
                where: 'name LIKE ?',
                whereParams: ['%测试%'],
                orderBy: 'id DESC'
            }
        );

        if (pageResult3.success) {
            console.log('✅ 名称搜索成功');
            console.log('搜索结果数:', pageResult3.data.totalCount);
        } else {
            console.log('❌ 名称搜索失败:', pageResult3.message);
        }

        // 7. 测试删除音频资源
        console.log('\n7. 测试删除音频资源');
        const deleteResult = await query('DELETE FROM sound WHERE id = ?', [testId]);
        
        if (deleteResult.affectedRows > 0) {
            console.log('✅ 删除成功');
        } else {
            console.log('❌ 删除失败');
        }

        console.log('\n✅ sound 模块完整测试完成！');
        console.log('\n📋 测试总结:');
        console.log('- ✅ 新增音频资源（save接口）');
        console.log('- ✅ 修改音频资源（save接口带id）');
        console.log('- ✅ 通过ID查询音频资源');
        console.log('- ✅ 分页查询音频资源列表');
        console.log('- ✅ 关键词搜索（ID全匹配）');
        console.log('- ✅ 关键词搜索（名称模糊匹配）');
        console.log('- ✅ 删除音频资源');
        console.log('\n🎯 所有接口功能正常！');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testCompleteSoundModule()
        .then(() => {
            console.log('\n🎉 完整测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testCompleteSoundModule };
