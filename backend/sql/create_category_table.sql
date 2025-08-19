-- 创建分类表
CREATE TABLE IF NOT EXISTS category (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT '分类名称',
    cover_img_url VARCHAR(500) DEFAULT NULL COMMENT '封面图',
    detail_img_url VARCHAR(500) DEFAULT NULL COMMENT '详情图',
    description TEXT DEFAULT NULL COMMENT '描述',
    new_start_time DATETIME DEFAULT NULL COMMENT 'NEW 开始时间',
    new_end_time DATETIME DEFAULT NULL COMMENT 'NEW 结束时间',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='分类表';

-- 创建分类与workout关联表
CREATE TABLE IF NOT EXISTS category_workout (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    workout_id BIGINT NOT NULL COMMENT 'workout ID',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workout(id) ON DELETE CASCADE,
    UNIQUE KEY uk_category_workout (category_id, workout_id)
) COMMENT='分类workout关联表';

-- 创建索引
CREATE INDEX idx_category_name ON category(name);
CREATE INDEX idx_category_status ON category(status);
CREATE INDEX idx_category_is_deleted ON category(is_deleted);
CREATE INDEX idx_category_new_start_time ON category(new_start_time);
CREATE INDEX idx_category_new_end_time ON category(new_end_time);

CREATE INDEX idx_category_workout_category_id ON category_workout(category_id);
CREATE INDEX idx_category_workout_workout_id ON category_workout(workout_id);
CREATE INDEX idx_category_workout_sort_order ON category_workout(sort_order);

-- 插入示例数据
INSERT INTO category (name, description, status) VALUES
('全身训练', '全身综合性训练分类', 'ENABLED'),
('核心训练', '专注核心肌群的训练分类', 'ENABLED'),
('有氧训练', '心肺功能提升训练分类', 'ENABLED'),
('力量训练', '肌肉力量增强训练分类', 'ENABLED'),
('柔韧性训练', '身体柔韧性提升训练分类', 'ENABLED');
