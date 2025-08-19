-- 帮助信息表
CREATE TABLE IF NOT EXISTS app_help (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '帮助名称',
    url VARCHAR(500) NOT NULL COMMENT '帮助链接',
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帮助信息表';

-- 插入示例帮助数据
INSERT INTO app_help (name, url) VALUES
('用户指南', 'https://example.com/help/user-guide'),
('API文档', 'https://example.com/help/api-docs'),
('快速开始', 'https://example.com/help/quick-start'),
('常见问题', 'https://example.com/help/faq'),
('联系支持', 'https://example.com/help/contact-support')

ON DUPLICATE KEY UPDATE
    url = VALUES(url);
