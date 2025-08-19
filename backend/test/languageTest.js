/**
 * Language模块测试
 */

const { query } = require('../config/database');

// 测试数据库表创建
async function testTableCreation() {
    try {
        console.log('🔍 测试Language表创建...');
        
        // 检查language表
        const languageTable = await query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE() AND table_name = 'language'
        `);
        console.log(`✅ language表: ${languageTable[0].count > 0 ? '存在' : '不存在'}`);
        
        if (languageTable[0].count > 0) {
            // 检查表结构
            const columns = await query(`
                SELECT column_name, data_type, column_comment
                FROM information_schema.columns 
                WHERE table_schema = DATABASE() AND table_name = 'language'
                ORDER BY ordinal_position
            `);
            
            console.log('   📋 表结构:');
            columns.forEach(col => {
                console.log(`      ${col.column_name} (${col.data_type}) - ${col.column_comment}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 测试表创建失败:', error);
    }
}

// 测试查询数据
async function testQueryData() {
    try {
        console.log('\n🔍 测试查询Language数据...');
        
        // 查询所有语言数据
        const languages = await query('SELECT * FROM language ORDER BY create_time ASC');
        console.log(`✅ 查询到 ${languages.length} 条语言数据`);
        
        if (languages.length > 0) {
            console.log('   📝 语言列表:');
            languages.forEach(lang => {
                console.log(`      ${lang.code} - ${lang.name}`);
            });
        }
        
        // 测试按编码查询
        const zhLang = await query('SELECT * FROM language WHERE code = ?', ['zh-CN']);
        console.log(`✅ 按编码查询: ${zhLang.length > 0 ? '成功' : '失败'}`);
        
        return languages;
        
    } catch (error) {
        console.error('❌ 测试查询数据失败:', error);
        return [];
    }
}

// 测试插入新语言
async function testInsertLanguage() {
    try {
        console.log('\n🔍 测试插入新语言...');
        
        // 插入测试语言
        const testCode = 'test-TEST';
        const testName = 'Test Language';
        
        // 先删除可能存在的测试数据
        await query('DELETE FROM language WHERE code = ?', [testCode]);
        
        // 插入新语言
        const insertResult = await query(
            'INSERT INTO language (code, name) VALUES (?, ?)',
            [testCode, testName]
        );
        
        console.log(`✅ 插入新语言成功，ID: ${insertResult.insertId}`);
        
        // 验证插入结果
        const insertedLang = await query('SELECT * FROM language WHERE code = ?', [testCode]);
        if (insertedLang.length > 0) {
            console.log(`   验证: ${insertedLang[0].code} - ${insertedLang[0].name}`);
        }
        
        // 清理测试数据
        await query('DELETE FROM language WHERE code = ?', [testCode]);
        console.log('✅ 清理测试数据完成');
        
    } catch (error) {
        console.error('❌ 测试插入新语言失败:', error);
    }
}

// 测试索引
async function testIndexes() {
    try {
        console.log('\n🔍 测试索引...');
        
        // 查询索引信息
        const indexes = await query(`
            SELECT 
                index_name,
                column_name,
                non_unique
            FROM information_schema.statistics 
            WHERE table_schema = DATABASE() 
            AND table_name = 'language'
            ORDER BY index_name, seq_in_index
        `);
        
        console.log(`✅ 找到 ${indexes.length} 个索引`);
        
        const indexGroups = {};
        indexes.forEach(idx => {
            if (!indexGroups[idx.index_name]) {
                indexGroups[idx.index_name] = [];
            }
            indexGroups[idx.index_name].push({
                column: idx.column_name,
                unique: idx.non_unique === 0
            });
        });
        
        Object.keys(indexGroups).forEach(indexName => {
            const columns = indexGroups[indexName].map(col => col.column).join(', ');
            const unique = indexGroups[indexName][0].unique ? '唯一' : '普通';
            console.log(`   ${indexName}: ${columns} (${unique})`);
        });
        
    } catch (error) {
        console.error('❌ 测试索引失败:', error);
    }
}

// 主测试函数
async function runTests() {
    console.log('🚀 开始Language模块测试\n');
    
    await testTableCreation();
    const languages = await testQueryData();
    
    if (languages.length > 0) {
        await testInsertLanguage();
    }
    
    await testIndexes();
    
    console.log('\n✅ Language模块测试完成');
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    testTableCreation,
    testQueryData,
    testInsertLanguage,
    testIndexes,
    runTests
};
