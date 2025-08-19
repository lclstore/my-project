-- 创建plan_replace_settings表
CREATE TABLE IF NOT EXISTS plan_replace_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT 'workout名称',
    description TEXT DEFAULT NULL COMMENT '描述',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='plan replace settings表';

-- 创建plan_replace_settings_rule表
CREATE TABLE IF NOT EXISTS plan_replace_settings_rule (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    plan_replace_settings_id BIGINT NOT NULL COMMENT 'plan replace settings ID',
    match_key ENUM('GENDER', 'USER') DEFAULT NULL COMMENT '匹配的key',
    match_condition ENUM('EQUALS', 'NOT_EQUALS') DEFAULT NULL COMMENT '匹配条件',
    match_value INT DEFAULT NULL COMMENT '匹配值',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (plan_replace_settings_id) REFERENCES plan_replace_settings(id) ON DELETE CASCADE
) COMMENT='plan replace settings rule表';

-- 创建plan_replace_settings_workout表
CREATE TABLE IF NOT EXISTS plan_replace_settings_workout (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    plan_replace_settings_id BIGINT NOT NULL COMMENT 'plan replace settings ID',
    workout_id BIGINT NOT NULL COMMENT 'workout ID',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (plan_replace_settings_id) REFERENCES plan_replace_settings(id) ON DELETE CASCADE
) COMMENT='plan replace settings workout表';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_plan_replace_settings_name ON plan_replace_settings(name);
CREATE INDEX IF NOT EXISTS idx_plan_replace_settings_status ON plan_replace_settings(status);
CREATE INDEX IF NOT EXISTS idx_plan_replace_settings_is_deleted ON plan_replace_settings(is_deleted);

CREATE INDEX IF NOT EXISTS idx_plan_replace_settings_rule_settings_id ON plan_replace_settings_rule(plan_replace_settings_id);
CREATE INDEX IF NOT EXISTS idx_plan_replace_settings_rule_match_key ON plan_replace_settings_rule(match_key);
CREATE INDEX IF NOT EXISTS idx_plan_replace_settings_rule_sort ON plan_replace_settings_rule(sort_order);

CREATE INDEX IF NOT EXISTS idx_plan_replace_settings_workout_settings_id ON plan_replace_settings_workout(plan_replace_settings_id);
CREATE INDEX IF NOT EXISTS idx_plan_replace_settings_workout_workout_id ON plan_replace_settings_workout(workout_id);
CREATE INDEX IF NOT EXISTS idx_plan_replace_settings_workout_sort ON plan_replace_settings_workout(sort_order);
