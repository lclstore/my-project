-- 创建发布记录表
CREATE TABLE IF NOT EXISTS publish (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    env ENUM('PRODUCTION', 'PRE_PRODUCTION') NOT NULL COMMENT '环境',
    remark TEXT DEFAULT NULL COMMENT '备注',
    status ENUM('WAITING', 'SUCCESS', 'FAIL', 'PROCESSING') NOT NULL DEFAULT 'WAITING' COMMENT '状态',
    version BIGINT NOT NULL COMMENT '版本号',
    create_user BIGINT NOT NULL COMMENT '创建用户ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_env (env),
    INDEX idx_status (status),
    INDEX idx_version (version),
    INDEX idx_create_user (create_user),
    INDEX idx_create_time (create_time),
    FOREIGN KEY (create_user) REFERENCES user(id)
) COMMENT='发布记录表';
