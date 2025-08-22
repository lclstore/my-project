/**
 * 数据库配置
 * 基于新的配置系统
 */

const config = require('./index');

module.exports = {
  // 获取数据库配置
  getDatabaseConfig() {
    return {
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      charset: config.database.charset,
      waitForConnections: true,
      connectionLimit: config.database.connectionLimit,
      queueLimit: 0,
      // 移除不支持的配置选项
      // acquireTimeout: config.database.acquireTimeout,  // MySQL2 不再支持
      // timeout: config.database.timeout,                // MySQL2 不再支持
      // reconnect: config.database.reconnect,            // MySQL2 不再支持
      // SSL配置（生产环境推荐）
      ssl: config.isProduction() ? {
        rejectUnauthorized: false
      } : false,
      // 时区设置
      timezone: '+08:00'
    };
  },

  // 获取连接池配置
  getPoolConfig() {
    return {
      min: 2,
      max: config.database.connectionLimit,
      idle: 30000,
      // acquire: config.database.acquireTimeout,  // MySQL2 不再支持
      evict: 1000
    };
  },

  // 数据库表配置
  tables: {
    // 用户表
    user: {
      name: 'user',
      primaryKey: 'id',
      fillable: ['email', 'password', 'name', 'avatar', 'status', 'type'],
      hidden: ['password'],
      timestamps: true,
      softDeletes: true
    },

    // 分类表
    category: {
      name: 'category',
      primaryKey: 'id',
      fillable: ['name', 'description', 'parent_id', 'sort_order', 'status'],
      timestamps: true,
      softDeletes: true
    },

    // 练习表
    exercise: {
      name: 'exercise',
      primaryKey: 'id',
      fillable: ['name', 'description', 'category_id', 'difficulty', 'duration', 'status'],
      timestamps: true,
      softDeletes: true
    },

    // 音频表
    sound: {
      name: 'sound',
      primaryKey: 'id',
      fillable: ['name', 'description', 'file_url', 'duration', 'category_id', 'status'],
      timestamps: true,
      softDeletes: true
    },

    // 训练计划表
    workout: {
      name: 'workout',
      primaryKey: 'id',
      fillable: ['name', 'description', 'category_id', 'difficulty', 'duration', 'status'],
      timestamps: true,
      softDeletes: true
    },

    // 程序表
    program: {
      name: 'programs',
      primaryKey: 'id',
      fillable: ['name', 'description', 'category_id', 'version', 'status'],
      timestamps: true,
      softDeletes: true
    },

    // 模板表
    template: {
      name: 'template',
      primaryKey: 'id',
      fillable: ['name', 'description', 'category_id', 'content', 'status'],
      timestamps: true,
      softDeletes: true
    },

    // 资源表
    resource: {
      name: 'resource',
      primaryKey: 'id',
      fillable: ['name', 'description', 'type', 'url', 'size', 'status'],
      timestamps: true,
      softDeletes: true
    },

    // 播放列表表
    playlist: {
      name: 'playlist',
      primaryKey: 'id',
      fillable: ['name', 'description', 'user_id', 'status'],
      timestamps: true,
      softDeletes: true
    },

    // 音乐表
    music: {
      name: 'music',
      primaryKey: 'id',
      fillable: ['name', 'artist', 'album', 'duration', 'file_url', 'status'],
      timestamps: true,
      softDeletes: true
    },

    // 操作日志表
    op_logs: {
      name: 'op_logs',
      primaryKey: 'id',
      fillable: ['user_id', 'action', 'table_name', 'record_id', 'old_data', 'new_data', 'id', 'user_agent'],
      timestamps: true,
      softDeletes: false
    },

    // 设置表
    plan_name_settings: {
      name: 'plan_name_settings',
      primaryKey: 'id',
      fillable: ['name', 'value', 'description', 'type'],
      timestamps: true,
      softDeletes: true
    },

    plan_replace_settings: {
      name: 'plan_replace_settings',
      primaryKey: 'id',
      fillable: ['name', 'value', 'description', 'type'],
      timestamps: true,
      softDeletes: true
    },

    workout_setting: {
      name: 'workout_setting',
      primaryKey: 'id',
      fillable: ['name', 'value', 'description', 'type'],
      timestamps: true,
      softDeletes: true
    }
  },

  // 字段映射配置
  fieldMappings: {
    // 通用字段映射
    common: {
      'id': 'id',
      'createTime': 'create_time',
      'updateTime': 'update_time',
      'isDeleted': 'is_deleted'
    },

    // 用户字段映射
    user: {
      'id': 'id',
      'email': 'email',
      'password': 'password',
      'name': 'name',
      'avatar': 'avatar',
      'status': 'status',
      'type': 'type',
      'createTime': 'create_time',
      'updateTime': 'update_time',
      'isDeleted': 'is_deleted'
    },

    // 分类字段映射
    category: {
      'id': 'id',
      'name': 'name',
      'description': 'description',
      'parentId': 'parent_id',
      'sortOrder': 'sort_order',
      'status': 'status',
      'createTime': 'create_time',
      'updateTime': 'update_time',
      'isDeleted': 'is_deleted'
    }

    // 其他表的字段映射可以根据需要添加...
  },

  // 验证规则配置
  validationRules: {
    user: {
      email: { required: true, type: 'email', maxLength: 100 },
      password: { required: true, type: 'string', minLength: 6, maxLength: 20 },
      name: { required: false, type: 'string', maxLength: 50 }
    },

    category: {
      name: { required: true, type: 'string', maxLength: 100 },
      description: { required: false, type: 'string', maxLength: 500 },
      parentId: { required: false, type: 'number' },
      sortOrder: { required: false, type: 'number', min: 0 }
    }

    // 其他表的验证规则可以根据需要添加...
  },

  // 获取表配置
  getTableConfig(tableName) {
    return this.tables[tableName] || null;
  },

  // 获取字段映射
  getFieldMapping(tableName) {
    return this.fieldMappings[tableName] || this.fieldMappings.common;
  },

  // 获取验证规则
  getValidationRules(tableName) {
    return this.validationRules[tableName] || {};
  }
};