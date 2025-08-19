/**
 * 简化的 sound 模块测试
 */

const { query } = require('../config/database');

async function simpleSoundTest() {
    try {
        console.log('🚀 开始简化测试...\n');

        // 1. 创建表
        console.log('1. 创建 sound 表');
        const createSQL = `CREATE TABLE IF NOT EXISTS sound (
            id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
            name VARCHAR(255) NOT NULL COMMENT '名称',
            genderCode ENUM('FEMALE', 'MALE', 'FEMALE_AND_MALE') NOT NULL COMMENT '性别',
            usageCode ENUM('FLOW', 'GENERAL') NOT NULL COMMENT '用途',
            femaleAudioUrl VARCHAR(500) COMMENT 'Female音频文件地址',
            femaleAudioDuration INT COMMENT 'Female音频时长(秒)',
            maleAudioUrl VARCHAR(500) COMMENT 'Male音频文件地址',
            maleAudioDuration INT COMMENT 'Male音频时长(秒)',
            translation TINYINT(1) NOT NULL COMMENT '是否进行翻译 1是 0否',
            femaleScript TEXT COMMENT 'female 翻译脚本',
            maleScript TEXT COMMENT 'male 翻译脚本',
            status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL COMMENT '状态',
            createTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
            updateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
        ) COMMENT='音频资源表'`;

        await query(createSQL);
        console.log('✅ 表创建成功');

        // 2. 查看表结构
        console.log('\n2. 查看表结构');
        const columns = await query('SHOW COLUMNS FROM sound');
        console.log('表字段:');
        columns.forEach(col => {
            console.log(`- ${col.Field} (${col.Type})`);
        });

        // 3. 插入测试数据
        console.log('\n3. 插入测试数据');
        const insertSQL = `INSERT INTO sound (
            name, genderCode, usageCode, femaleAudioUrl, femaleAudioDuration, 
            translation, femaleScript, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        const insertResult = await query(insertSQL, [
            '测试欢迎语音',
            'FEMALE',
            'GENERAL',
            'https://example.com/female-welcome.mp3',
            30,
            1,
            'Welcome to our service',
            'ENABLED'
        ]);

        console.log('✅ 插入成功，ID:', insertResult.insertId);
        const testId = insertResult.insertId;

        // 4. 查询数据
        console.log('\n4. 查询数据');
        const selectResult = await query('SELECT * FROM sound WHERE id = ?', [testId]);
        if (selectResult.length > 0) {
            console.log('✅ 查询成功:', {
                id: selectResult[0].id,
                name: selectResult[0].name,
                genderCode: selectResult[0].genderCode,
                status: selectResult[0].status
            });
        }

        // 5. 更新数据
        console.log('\n5. 更新数据');
        const updateSQL = `UPDATE sound SET 
            name = ?, genderCode = ?, usageCode = ?, maleAudioUrl = ?, maleAudioDuration = ?
            WHERE id = ?`;

        const updateResult = await query(updateSQL, [
            '测试欢迎语音（已修改）',
            'FEMALE_AND_MALE',
            'FLOW',
            'https://example.com/male-welcome.mp3',
            40,
            testId
        ]);

        if (updateResult.affectedRows > 0) {
            console.log('✅ 更新成功');
        }

        // 6. 分页查询
        console.log('\n6. 分页查询');
        const pageResult = await query('SELECT * FROM sound ORDER BY id DESC LIMIT ? OFFSET ?', [10, 0]);
        console.log('✅ 分页查询成功，记录数:', pageResult.length);

        // 7. 关键词搜索
        console.log('\n7. 关键词搜索');
        const searchResult = await query('SELECT * FROM sound WHERE name LIKE ?', ['%测试%']);
        console.log('✅ 搜索成功，匹配记录数:', searchResult.length);

        // 8. 删除数据
        console.log('\n8. 删除数据');
        const deleteResult = await query('DELETE FROM sound WHERE id = ?', [testId]);
        if (deleteResult.affectedRows > 0) {
            console.log('✅ 删除成功');
        }

        console.log('\n✅ 简化测试完成！所有基本操作都正常工作');

    } catch (error) {
        console.error('❌ 测试失败:', error);
        throw error;
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    simpleSoundTest()
        .then(() => {
            console.log('\n🎉 测试完成');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 测试失败:', error);
            process.exit(1);
        });
}

module.exports = { simpleSoundTest };
