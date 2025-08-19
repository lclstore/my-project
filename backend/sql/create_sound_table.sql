-- 创建音频资源表
CREATE TABLE IF NOT EXISTS sound (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'ID',
    name VARCHAR(255) NOT NULL COMMENT '名称',
    genderCode ENUM('FEMALE', 'MALE', 'FEMALE_AND_MALE') NOT NULL COMMENT '性别',
    usageCode ENUM('FLOW', 'GENERAL') NOT NULL COMMENT '用途',
    femaleAudioUrl VARCHAR(500) COMMENT 'Female音频文件地址',
    femaleAudioDuration INT COMMENT 'Female音频时长(秒)',
    maleAudioUrl VARCHAR(500) COMMENT 'Male音频文件地址',
    maleAudioDuration INT COMMENT 'Male音频时长(秒)',
    translation TINYINT(1) NOT NULL COMMENT '是否进行翻译 1是 0否',
    femaleScript TEXT COMMENT 'female 翻译脚本',
    maleScript TEXT COMMENT 'male 翻译脚本',
    status ENUM('DRAFT', 'ENABLED', 'DISABLED') NOT NULL COMMENT '状态',
    createTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='音频资源表';
