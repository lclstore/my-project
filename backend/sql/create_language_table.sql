-- 创建系统语言表
CREATE TABLE IF NOT EXISTS language (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    code VARCHAR(10) NOT NULL COMMENT '语言编码，如 zh-CN、en-US',
    name VARCHAR(50) NOT NULL COMMENT '语言名称，如 中文、English',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) COMMENT='系统语言表';

-- 创建索引
ALTER TABLE language ADD UNIQUE INDEX idx_language_code (code);
ALTER TABLE language ADD INDEX idx_language_name (name);

-- 插入初始数据
INSERT INTO language (code, name) VALUES 
('zh-CN', '中文'),
('en-US', 'English'),
('ja-JP', '日本語'),
('ko-KR', '한국어'),
('es-ES', 'Español'),
('fr-FR', 'Français'),
('de-DE', 'Deutsch'),
('it-IT', 'Italiano'),
('pt-PT', 'Português'),
('ru-RU', 'Русский')
ON DUPLICATE KEY UPDATE name = VALUES(name);
