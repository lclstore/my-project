-- 为 files 表添加 Cloudinary 相关字段
ALTER TABLE files 
ADD COLUMN cloudinary_id VARCHAR(255) COMMENT 'Cloudinary 公共ID',
ADD COLUMN cloudinary_url VARCHAR(500) COMMENT 'Cloudinary 文件URL',
ADD INDEX idx_cloudinary_id (cloudinary_id);

-- 更新现有字段注释
ALTER TABLE files 
MODIFY COLUMN file_path VARCHAR(500) COMMENT '文件路径或Cloudinary URL';

-- 显示更新后的表结构
DESCRIBE files;
