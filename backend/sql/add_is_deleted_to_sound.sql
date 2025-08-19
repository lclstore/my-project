-- 为 sound 表添加 is_deleted 字段
-- 这个字段用于逻辑删除标识

-- 检查字段是否已存在，如果不存在则添加
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = 'sound' 
    AND column_name = 'is_deleted'
);

-- 如果字段不存在，则添加
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE sound ADD COLUMN is_deleted TINYINT(1) DEFAULT 0 COMMENT ''删除标识：0-未删除，1-已删除'' AFTER status',
    'SELECT ''is_deleted column already exists in sound table'' as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 显示添加结果
SELECT 
    CASE 
        WHEN @column_exists = 0 THEN '✅ sound表 is_deleted 字段添加成功'
        ELSE '⚠️  sound表 is_deleted 字段已存在，跳过添加'
    END as result;

-- 显示 sound 表的字段结构
SELECT 
    column_name as '字段名',
    data_type as '数据类型',
    is_nullable as '可空',
    column_default as '默认值',
    column_comment as '注释'
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
AND table_name = 'sound'
ORDER BY ordinal_position;
