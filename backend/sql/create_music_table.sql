-- 创建music表
CREATE TABLE IF NOT EXISTS music (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT '名称',
    display_name VARCHAR(255) NOT NULL COMMENT '显示名称',
    audio_url VARCHAR(500) DEFAULT NULL COMMENT '音频文件地址',
    audio_duration INT NOT NULL COMMENT '音频时长（秒）',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='music音乐表';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_music_name ON music(name);
CREATE INDEX IF NOT EXISTS idx_music_display_name ON music(display_name);
CREATE INDEX IF NOT EXISTS idx_music_status ON music(status);
CREATE INDEX IF NOT EXISTS idx_music_is_deleted ON music(is_deleted);
CREATE INDEX IF NOT EXISTS idx_music_audio_duration ON music(audio_duration);
