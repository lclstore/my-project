-- 创建动作资源表
CREATE TABLE IF NOT EXISTS exercise (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    name VARCHAR(255) NOT NULL COMMENT '动作名称',
    cover_img_url VARCHAR(500) DEFAULT NULL COMMENT '封面图',
    met BIGINT DEFAULT NULL COMMENT 'met',
    structure_type_code ENUM('WARM_UP', 'MAIN', 'COOL_DOWN') DEFAULT NULL COMMENT '结构类型code',
    gender_code ENUM('FEMALE', 'MALE') DEFAULT NULL COMMENT '性别code',
    difficulty_code ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') DEFAULT NULL COMMENT '难度code',
    equipment_code ENUM('NO_EQUIPMENT', 'CHAIR') DEFAULT NULL COMMENT '器械code',
    position_code ENUM('STANDING', 'SEATED') DEFAULT NULL COMMENT '部位code',
    injured_codes JSON DEFAULT NULL COMMENT '受伤类型code数组（可用值: SHOULDER,BACK,WRIST,KNEE,ANKLE,HIP,NONE）',
    name_audio_url VARCHAR(500) DEFAULT NULL COMMENT '名称音频地址',
    name_audio_url_duration INT DEFAULT NULL COMMENT '名称音频时长(秒)',
    howtodo_script TEXT DEFAULT NULL COMMENT 'How to do文本',
    howtodo_audio_url VARCHAR(500) DEFAULT NULL COMMENT 'How to do音频',
    howtodo_audio_url_duration INT DEFAULT NULL COMMENT 'How to do音频时长(秒)',
    guidance_script TEXT DEFAULT NULL COMMENT '指导文本',
    guidance_audio_url VARCHAR(500) DEFAULT NULL COMMENT '指导音频地址',
    guidance_audio_url_duration INT DEFAULT NULL COMMENT '指导音频时长(秒)',
    front_video_url VARCHAR(500) DEFAULT NULL COMMENT '正机位视频地址',
    front_video_url_duration INT DEFAULT NULL COMMENT '正机位视频时长(秒)',
    side_video_url VARCHAR(500) DEFAULT NULL COMMENT '侧机位视频地址',
    side_video_url_duration INT DEFAULT NULL COMMENT '侧机位视频时长(秒)',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='动作资源表';

-- 创建索引
CREATE INDEX idx_exercise_name ON exercise(name);
CREATE INDEX idx_exercise_status ON exercise(status);
CREATE INDEX idx_exercise_structure_type ON exercise(structure_type_code);
CREATE INDEX idx_exercise_gender ON exercise(gender_code);
CREATE INDEX idx_exercise_difficulty ON exercise(difficulty_code);
CREATE INDEX idx_exercise_equipment ON exercise(equipment_code);
CREATE INDEX idx_exercise_position ON exercise(position_code);
