-- 创建template表
CREATE TABLE IF NOT EXISTS template (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT 'template名称',
    description TEXT DEFAULT NULL COMMENT '描述',
    duration_code ENUM('MIN_5_10', 'MIN_10_15', 'MIN_15_20', 'MIN_20_30') NOT NULL COMMENT '时长',
    days INT NOT NULL COMMENT '天数',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='template表';

-- 创建template_unit表
CREATE TABLE IF NOT EXISTS template_unit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    template_id BIGINT NOT NULL COMMENT 'template ID',
    structure_name VARCHAR(255) DEFAULT NULL COMMENT 'template unit名称',
    structure_type_code ENUM('WARM_UP', 'MAIN', 'COOL_DOWN') DEFAULT NULL COMMENT 'exercise 结构类型code',
    count INT DEFAULT NULL COMMENT 'exercise 数量',
    round INT DEFAULT NULL COMMENT 'exercise 循环次数',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (template_id) REFERENCES template(id) ON DELETE CASCADE
) COMMENT='template unit表';

-- 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_template_name ON template(name);
CREATE INDEX IF NOT EXISTS idx_template_status ON template(status);
CREATE INDEX IF NOT EXISTS idx_template_duration_code ON template(duration_code);
CREATE INDEX IF NOT EXISTS idx_template_is_deleted ON template(is_deleted);

CREATE INDEX IF NOT EXISTS idx_template_unit_template_id ON template_unit(template_id);
CREATE INDEX IF NOT EXISTS idx_template_unit_structure_type ON template_unit(structure_type_code);
CREATE INDEX IF NOT EXISTS idx_template_unit_sort ON template_unit(sort_order);
