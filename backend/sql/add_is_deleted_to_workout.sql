-- 为workout表添加is_deleted字段
ALTER TABLE workout ADD COLUMN is_deleted TINYINT(1) DEFAULT 0 COMMENT '是否删除（0正常 1已删除）';

-- 创建is_deleted字段的索引
CREATE INDEX idx_workout_is_deleted ON workout(is_deleted);

-- 更新现有数据，设置为未删除状态
UPDATE workout SET is_deleted = 0 WHERE is_deleted IS NULL;
