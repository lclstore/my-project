-- 应用信息表
CREATE TABLE IF NOT EXISTS app_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_name VARCHAR(100) NOT NULL COMMENT '应用名称',
    app_version VARCHAR(20) NOT NULL COMMENT '应用版本',
    description TEXT COMMENT '应用描述',
    logo_url VARCHAR(500) COMMENT 'Logo图片URL',
    company_name VARCHAR(100) COMMENT '公司名称',
    contact_email VARCHAR(100) COMMENT '联系邮箱',
    website_url VARCHAR(200) COMMENT '官网地址',
    features JSON COMMENT '功能特性列表',
    config JSON COMMENT '应用配置信息',
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_status (status),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='应用信息表';

-- 插入默认应用信息
INSERT INTO app_info (
    app_name, 
    app_version, 
    description, 
    company_name, 
    contact_email, 
    website_url,
    features,
    config
) VALUES (
    '全栈应用系统',
    '1.0.0',
    '这是一个功能完整的全栈应用系统，支持用户管理、文件管理、数据管理等功能',
    '技术公司',
    'admin@example.com',
    'https://example.com',
    JSON_ARRAY(
        '用户认证与授权',
        '文件上传与管理', 
        '数据CRUD操作',
        '枚举数据管理',
        'API文档自动生成',
        'CORS跨域支持',
        '字段命名自动转换',
        'Token黑名单管理'
    ),
    JSON_OBJECT(
        'maxFileSize', '10MB',
        'allowedFileTypes', JSON_ARRAY('image/*', 'application/pdf', 'text/*'),
        'tokenExpireTime', '24h',
        'enableSwagger', true,
        'enableCors', true
    )
) ON DUPLICATE KEY UPDATE
    update_time = CURRENT_TIMESTAMP;
