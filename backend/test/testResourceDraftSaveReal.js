/**
 * 测试Resource草稿保存功能（真实数据库测试）
 */

const { query, transaction } = require('../config/database');
const { validateApiData } = require('../utils/validator');
const { sanitizeParams } = require('../utils/commonHelper');

async function testResourceDraftSaveReal() {
    try {
        console.log('🔍 测试Resource草稿保存功能（真实数据库）...\n');

        // 1. 测试草稿状态验证
        console.log('1. 测试草稿状态验证:');
        const draftData = {
            name: '测试草稿资源',
            status: 'DRAFT'
            // 其他字段都不传
        };

        const draftValidation = validateApiData('resource.draft', draftData);
        console.log('   草稿验证结果:', draftValidation.valid ? '✅ 通过' : '❌ 失败');
        if (!draftValidation.valid) {
            console.log('   错误信息:', draftValidation.errors);
            return;
        }

        // 2. 测试直接数据库插入（模拟API逻辑）
        console.log('\n2. 测试数据库插入草稿数据:');
        
        let testResourceId = null;
        
        try {
            const result = await transaction(async (connection) => {
                const insertSql = `
                    INSERT INTO resource (name, description, application_code, gender_code, cover_img_url, detail_img_url, status, create_time, update_time)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `;
                const insertParams = sanitizeParams([
                    draftData.name,
                    draftData.description,  // undefined -> null
                    draftData.applicationCode,  // undefined -> null
                    draftData.genderCode,  // undefined -> null
                    draftData.coverImgUrl,  // undefined -> null
                    draftData.detailImgUrl,  // undefined -> null
                    draftData.status
                ]);
                
                console.log('   插入参数:', insertParams);
                
                const [insertResult] = await connection.execute(insertSql, insertParams);
                return { resourceId: insertResult.insertId };
            });
            
            testResourceId = result.resourceId;
            console.log(`   ✅ 草稿数据插入成功，ID: ${testResourceId}`);
            
        } catch (error) {
            console.error('   ❌ 草稿数据插入失败:', error.message);
            throw error;
        }

        // 3. 验证插入的数据
        console.log('\n3. 验证插入的草稿数据:');
        const insertedData = await query('SELECT * FROM resource WHERE id = ?', [testResourceId]);
        
        if (insertedData.length > 0) {
            const record = insertedData[0];
            console.log('   插入的记录:');
            console.log(`     - ID: ${record.id}`);
            console.log(`     - Name: ${record.name}`);
            console.log(`     - Description: ${record.description || 'NULL'}`);
            console.log(`     - Application Code: ${record.application_code || 'NULL'}`);
            console.log(`     - Gender Code: ${record.gender_code || 'NULL'}`);
            console.log(`     - Cover Image URL: ${record.cover_img_url || 'NULL'}`);
            console.log(`     - Detail Image URL: ${record.detail_img_url || 'NULL'}`);
            console.log(`     - Status: ${record.status}`);
            console.log('   ✅ 草稿数据验证成功');
        } else {
            console.log('   ❌ 未找到插入的记录');
        }

        // 4. 测试更新草稿为完整数据
        console.log('\n4. 测试更新草稿为完整数据:');
        
        const completeData = {
            id: testResourceId,
            name: '更新后的完整资源',
            description: '这是完整的资源描述',
            applicationCode: 'PLAN',
            genderCode: 'FEMALE',
            coverImgUrl: 'https://example.com/cover.jpg',
            detailImgUrl: 'https://example.com/detail.jpg',
            status: 'ENABLED'
        };

        // 验证完整数据
        const completeValidation = validateApiData('resource', completeData);
        console.log('   完整数据验证结果:', completeValidation.valid ? '✅ 通过' : '❌ 失败');
        if (!completeValidation.valid) {
            console.log('   错误信息:', completeValidation.errors);
        } else {
            // 更新数据库
            const updateSql = `
                UPDATE resource 
                SET name = ?, description = ?, application_code = ?, gender_code = ?, 
                    cover_img_url = ?, detail_img_url = ?, status = ?, update_time = NOW()
                WHERE id = ? AND is_deleted = 0
            `;
            const updateParams = sanitizeParams([
                completeData.name,
                completeData.description,
                completeData.applicationCode,
                completeData.genderCode,
                completeData.coverImgUrl,
                completeData.detailImgUrl,
                completeData.status,
                testResourceId
            ]);
            
            const updateResult = await query(updateSql, updateParams);
            console.log(`   ✅ 更新成功，影响行数: ${updateResult.affectedRows}`);
        }

        // 5. 清理测试数据
        console.log('\n5. 清理测试数据:');
        await query('DELETE FROM resource WHERE id = ?', [testResourceId]);
        console.log('   ✅ 测试数据清理完成');

        console.log('\n🎉 所有Resource草稿保存测试完成！');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('错误详情:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    testResourceDraftSaveReal()
        .then(() => {
            console.log('\n✅ 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { testResourceDraftSaveReal };
