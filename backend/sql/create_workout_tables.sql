-- 创建workout相关表结构

-- 1. 主表：workout - 存放整体训练的元信息
CREATE TABLE IF NOT EXISTS workout (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    name VARCHAR(255) NOT NULL COMMENT 'workout名称',
    description TEXT DEFAULT NULL COMMENT '描述',
    premium TINYINT(1) DEFAULT 0 COMMENT '是否需要订阅（0不需要 1需要）',
    new_start_time DATETIME DEFAULT NULL COMMENT 'NEW 开始时间',
    new_end_time DATETIME DEFAULT NULL COMMENT 'NEW 结束时间',
    cover_img_url VARCHAR(500) DEFAULT NULL COMMENT '封面图',
    detail_img_url VARCHAR(500) DEFAULT NULL COMMENT '详情图',
    thumbnail_img_url VARCHAR(500) DEFAULT NULL COMMENT '缩略图',
    complete_img_url VARCHAR(500) DEFAULT NULL COMMENT '完成图',
    gender_code ENUM('FEMALE', 'MALE') DEFAULT NULL COMMENT '性别code',
    difficulty_code ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') DEFAULT NULL COMMENT '难度code',
    position_code ENUM('STANDING', 'SEATED') DEFAULT NULL COMMENT '部位code',
    calorie INT DEFAULT NULL COMMENT '卡路里',
    duration INT DEFAULT NULL COMMENT '时长',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL DEFAULT 'DRAFT' COMMENT '状态',
    file_status ENUM('WAITING', 'PROCESSING', 'SUCCESSFUL', 'FAILED') DEFAULT 'WAITING' COMMENT '文件状态',
    audio_json_languages JSON DEFAULT NULL COMMENT '音频语言数组',
    is_deleted TINYINT(1) DEFAULT 0 COMMENT '是否删除（0正常 1已删除）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='workout主表';

-- 2. 受伤类型关联表：workout_injured - 存储workout与受伤类型的多对多关系
CREATE TABLE IF NOT EXISTS workout_injured (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    workout_id BIGINT NOT NULL COMMENT 'workout ID',
    injured_code ENUM('SHOULDER', 'BACK', 'WRIST', 'KNEE', 'ANKLE', 'HIP', 'NONE') NOT NULL COMMENT '受伤类型code',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (workout_id) REFERENCES workout(id) ON DELETE CASCADE,
    UNIQUE KEY uk_workout_injured (workout_id, injured_code)
) COMMENT='workout受伤类型关联表';

-- 3. 结构表：workout_structure - 每个workout下的分组/结构
CREATE TABLE IF NOT EXISTS workout_structure (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    workout_id BIGINT NOT NULL COMMENT 'workout ID',
    structure_name VARCHAR(255) DEFAULT NULL COMMENT 'structure name',
    structure_round INT DEFAULT NULL COMMENT 'structure round',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (workout_id) REFERENCES workout(id) ON DELETE CASCADE
) COMMENT='workout结构表';

-- 4. 动作关联表：workout_structure_exercise - 记录某组包含哪些动作
CREATE TABLE IF NOT EXISTS workout_structure_exercise (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    workout_structure_id BIGINT NOT NULL COMMENT 'workout结构ID',
    exercise_id BIGINT NOT NULL COMMENT '动作ID',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (workout_structure_id) REFERENCES workout_structure(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE
) COMMENT='workout结构动作关联表';

-- 创建索引
CREATE INDEX idx_workout_name ON workout(name);
CREATE INDEX idx_workout_status ON workout(status);
CREATE INDEX idx_workout_gender ON workout(gender_code);
CREATE INDEX idx_workout_difficulty ON workout(difficulty_code);
CREATE INDEX idx_workout_position ON workout(position_code);
CREATE INDEX idx_workout_premium ON workout(premium);
CREATE INDEX idx_workout_new_start_time ON workout(new_start_time);
CREATE INDEX idx_workout_new_end_time ON workout(new_end_time);
CREATE INDEX idx_workout_is_deleted ON workout(is_deleted);

CREATE INDEX idx_workout_injured_workout_id ON workout_injured(workout_id);
CREATE INDEX idx_workout_injured_code ON workout_injured(injured_code);

CREATE INDEX idx_workout_structure_workout_id ON workout_structure(workout_id);
CREATE INDEX idx_workout_structure_sort ON workout_structure(sort_order);

CREATE INDEX idx_workout_structure_exercise_structure_id ON workout_structure_exercise(workout_structure_id);
CREATE INDEX idx_workout_structure_exercise_exercise_id ON workout_structure_exercise(exercise_id);
CREATE INDEX idx_workout_structure_exercise_sort ON workout_structure_exercise(sort_order);
