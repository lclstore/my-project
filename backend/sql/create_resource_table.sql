-- 创建resource表
CREATE TABLE IF NOT EXISTS resource (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT 'resource名称',
    description TEXT DEFAULT NULL COMMENT '描述',
    application_code ENUM('PLAN', 'WORKOUT') DEFAULT NULL COMMENT 'application code',
    gender_code ENUM('FEMALE', 'MALE') DEFAULT NULL COMMENT '性别code',
    cover_img_url VARCHAR(500) DEFAULT NULL COMMENT '封面图',
    detail_img_url VARCHAR(500) DEFAULT NULL COMMENT '详情图',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='resource表';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_resource_name ON resource(name);
CREATE INDEX IF NOT EXISTS idx_resource_status ON resource(status);
CREATE INDEX IF NOT EXISTS idx_resource_application_code ON resource(application_code);
CREATE INDEX IF NOT EXISTS idx_resource_gender_code ON resource(gender_code);
CREATE INDEX IF NOT EXISTS idx_resource_is_deleted ON resource(is_deleted);
