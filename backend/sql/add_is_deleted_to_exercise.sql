-- 为 exercise 表添加逻辑删除字段
ALTER TABLE exercise ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除(0:未删除,1:已删除)';

-- 为 is_deleted 字段创建索引
CREATE INDEX idx_exercise_is_deleted ON exercise(is_deleted);
