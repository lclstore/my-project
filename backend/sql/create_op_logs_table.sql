-- 创建op_logs表
CREATE TABLE IF NOT EXISTS op_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    biz_type VARCHAR(100) NOT NULL COMMENT '业务类型',
    data_id INT NOT NULL COMMENT '数据id',
    data_info TEXT DEFAULT NULL COMMENT '数据信息',
    operation_type ENUM('ADD', 'UPDATE', 'DELETE', 'ENABLE', 'DISABLE', 'TEMPLATE_GENERATE_WORKOUT', 'TEMPLATE_GENERATE_WORKOUT_FILE', 'SAVE', 'WORKOUT_GENERATE_FILE') NOT NULL COMMENT '操作类型',
    data_after TEXT DEFAULT NULL COMMENT '操作后数据',
    operation_user VARCHAR(255) NOT NULL COMMENT '操作人',
    operation_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT='操作日志表';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_op_logs_biz_type ON op_logs(biz_type);
CREATE INDEX IF NOT EXISTS idx_op_logs_data_id ON op_logs(data_id);
CREATE INDEX IF NOT EXISTS idx_op_logs_operation_type ON op_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_op_logs_operation_user ON op_logs(operation_user);
CREATE INDEX IF NOT EXISTS idx_op_logs_operation_time ON op_logs(operation_time);
CREATE INDEX IF NOT EXISTS idx_op_logs_create_time ON op_logs(create_time);
