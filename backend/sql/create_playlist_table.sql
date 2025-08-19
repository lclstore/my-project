-- 创建playlist表
CREATE TABLE IF NOT EXISTS playlist (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(255) NOT NULL COMMENT '名称',
    type ENUM('REGULAR', 'YOGA', 'DANCE') DEFAULT 'REGULAR' COMMENT '类型',
    premium TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否需要订阅（0不需要 1需要）',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除（0未删除 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='playlist播放列表表';

-- 创建playlist_music关联表
CREATE TABLE IF NOT EXISTS playlist_music (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    playlist_id BIGINT NOT NULL COMMENT 'playlist ID',
    biz_music_id BIGINT NOT NULL COMMENT 'music ID',
    premium TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否需要订阅（0不需要 1需要）',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (playlist_id) REFERENCES playlist(id) ON DELETE CASCADE
) COMMENT='playlist music关联表';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_playlist_name ON playlist(name);
CREATE INDEX IF NOT EXISTS idx_playlist_type ON playlist(type);
CREATE INDEX IF NOT EXISTS idx_playlist_premium ON playlist(premium);
CREATE INDEX IF NOT EXISTS idx_playlist_status ON playlist(status);
CREATE INDEX IF NOT EXISTS idx_playlist_is_deleted ON playlist(is_deleted);

CREATE INDEX IF NOT EXISTS idx_playlist_music_playlist_id ON playlist_music(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_music_biz_music_id ON playlist_music(biz_music_id);
CREATE INDEX IF NOT EXISTS idx_playlist_music_sort ON playlist_music(sort_order);
