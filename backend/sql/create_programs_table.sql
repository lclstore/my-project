-- 创建program表
CREATE TABLE IF NOT EXISTS program (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT 'program名称',
    event_name VARCHAR(255) DEFAULT NULL COMMENT 'event name',
    cover_img_url VARCHAR(500) NOT NULL COMMENT '封面图',
    detail_img_url VARCHAR(500) NOT NULL COMMENT '详情图',
    description TEXT DEFAULT NULL COMMENT '描述',
    show_type_code ENUM('HORIZONTAL', 'CARD') NOT NULL COMMENT '展示类型',
    duration_week INT NOT NULL COMMENT 'Duration Week',
    difficulty_code ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') NOT NULL COMMENT '难度code',
    equipment_code ENUM('DUMBBELLS', 'RESISTANCE_BAND', 'NONE') NOT NULL COMMENT '器械code',
    new_start_time DATETIME DEFAULT NULL COMMENT 'NEW 开始时间',
    new_end_time DATETIME DEFAULT NULL COMMENT 'NEW 结束时间',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    sort INT DEFAULT 0 COMMENT '排序字段',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='programs表';

-- 创建program与workout关联表
CREATE TABLE IF NOT EXISTS program_workout (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    program_id BIGINT NOT NULL COMMENT 'program ID',
    workout_id BIGINT NOT NULL COMMENT 'workout ID',
    sort INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (program_id) REFERENCES program(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_id) REFERENCES workout(id) ON DELETE CASCADE,
    UNIQUE KEY uk_program_workout (program_id, workout_id)
) COMMENT='program workout关联表';

-- 创建索引
CREATE INDEX idx_program_name ON program(name);
CREATE INDEX idx_program_status ON program(status);
CREATE INDEX idx_program_show_type_code ON program(show_type_code);
CREATE INDEX idx_program_difficulty_code ON program(difficulty_code);
CREATE INDEX idx_program_equipment_code ON program(equipment_code);
CREATE INDEX idx_program_duration_week ON program(duration_week);
CREATE INDEX idx_program_sort ON program(sort);
CREATE INDEX idx_program_is_deleted ON program(is_deleted);
CREATE INDEX idx_program_new_start_time ON program(new_start_time);
CREATE INDEX idx_program_new_end_time ON program(new_end_time);

CREATE INDEX idx_program_workout_program_id ON program_workout(program_id);
CREATE INDEX idx_program_workout_workout_id ON program_workout(workout_id);
CREATE INDEX idx_program_workout_sort ON program_workout(sort);

-- 插入示例数据
INSERT INTO program (name, cover_img_url, detail_img_url, description, show_type_code, duration_week, difficulty_code, equipment_code, status) VALUES
('初级训练计划', 'https://example.com/cover1.jpg', 'https://example.com/detail1.jpg', '适合初学者的全面训练计划', 'HORIZONTAL', 4, 'BEGINNER', 'NONE', 'ENABLED'),
('中级力量训练', 'https://example.com/cover2.jpg', 'https://example.com/detail2.jpg', '中级水平的力量提升训练计划', 'CARD', 6, 'INTERMEDIATE', 'DUMBBELLS', 'ENABLED'),
('高级综合训练', 'https://example.com/cover3.jpg', 'https://example.com/detail3.jpg', '高级水平的综合性训练计划', 'HORIZONTAL', 8, 'ADVANCED', 'RESISTANCE_BAND', 'ENABLED'),
('减脂训练计划', 'https://example.com/cover4.jpg', 'https://example.com/detail4.jpg', '专注于减脂的训练计划', 'CARD', 12, 'BEGINNER', 'NONE', 'ENABLED'),
('增肌训练计划', 'https://example.com/cover5.jpg', 'https://example.com/detail5.jpg', '专注于增肌的训练计划', 'HORIZONTAL', 10, 'INTERMEDIATE', 'DUMBBELLS', 'ENABLED');
