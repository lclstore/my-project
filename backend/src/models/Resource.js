/**
 * 资源模型
 * 通用资源数据的操作和验证
 */

const BaseModel = require('../core/BaseModel');
const { DATA_STATUS, FILE_TYPES } = require('../config/constants');

class Resource extends BaseModel {
  constructor() {
    super({
      tableName: 'resource',
      primaryKey: 'id',
      fillable: [
        'name',
        'description',
        'type',
        'file_url',
        'file_size',
        'mime_type',
        'duration',
        'category_id',
        'status',
        'tags',
        'metadata',
        'download_count',
        'uploaded_by'
      ],
      casts: {
        category_id: 'int',
        status: 'int',
        file_size: 'int',
        duration: 'int',
        download_count: 'int',
        uploaded_by: 'int',
        metadata: 'json',
        tags: 'json'
      },
      timestamps: true,
      softDeletes: true
    });
  }

  /**
   * 创建资源前的处理
   */
  async beforeCreate(data) {
    // 设置默认值
    if (!data.status) {
      data.status = DATA_STATUS.ENABLED;
    }

    if (!data.download_count) {
      data.download_count = 0;
    }

    // 根据文件类型设置type
    if (!data.type && data.mime_type) {
      data.type = this.getFileTypeFromMimeType(data.mime_type);
    }

    // 处理标签和元数据
    if (data.tags && typeof data.tags === 'string') {
      try {
        data.tags = JSON.parse(data.tags);
      } catch (e) {
        data.tags = data.tags.split(',').map(tag => tag.trim());
      }
    }

    if (data.metadata && typeof data.metadata === 'string') {
      try {
        data.metadata = JSON.parse(data.metadata);
      } catch (e) {
        data.metadata = {};
      }
    }

    return data;
  }

  /**
   * 根据MIME类型确定文件类型
   */
  getFileTypeFromMimeType(mimeType) {
    if (mimeType.startsWith('image/')) {
      return FILE_TYPES.IMAGE;
    } else if (mimeType.startsWith('audio/')) {
      return FILE_TYPES.AUDIO;
    } else if (mimeType.startsWith('video/')) {
      return FILE_TYPES.VIDEO;
    } else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
      return FILE_TYPES.DOCUMENT;
    } else if (mimeType.includes('zip') || mimeType.includes('archive')) {
      return FILE_TYPES.ARCHIVE;
    } else {
      return FILE_TYPES.OTHER;
    }
  }

  /**
   * 根据分类获取资源
   */
  async getByCategory(categoryId, options = {}) {
    const {
      pageIndex = 1,
      pageSize = 10,
      status = DATA_STATUS.ENABLED,
      orderBy = 'create_time DESC'
    } = options;

    const whereConditions = [
      'category_id = ?',
      '(is_deleted = 0 OR is_deleted IS NULL)'
    ];
    const params = [categoryId];

    if (status !== null) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    return await this.paginate({
      where: whereConditions.join(' AND '),
      whereParams: params,
      orderBy,
      pageIndex,
      pageSize
    });
  }

  /**
   * 根据类型获取资源
   */
  async getByType(type, options = {}) {
    const {
      pageIndex = 1,
      pageSize = 10,
      status = DATA_STATUS.ENABLED,
      orderBy = 'create_time DESC'
    } = options;

    const whereConditions = [
      'type = ?',
      '(is_deleted = 0 OR is_deleted IS NULL)'
    ];
    const params = [type];

    if (status !== null) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    return await this.paginate({
      where: whereConditions.join(' AND '),
      whereParams: params,
      orderBy,
      pageIndex,
      pageSize
    });
  }

  /**
   * 搜索资源
   */
  async searchResources(keyword, options = {}) {
    try {
      const {
        type = null,
        categoryId = null,
        status = null,
        pageIndex = 1,
        pageSize = 10,
        orderBy = 'create_time DESC'
      } = options;

      const whereConditions = ['(is_deleted = 0 OR is_deleted IS NULL)'];
      const params = [];

      if (keyword) {
        whereConditions.push('(name LIKE ? OR description LIKE ? OR tags LIKE ?)');
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }

      if (type) {
        whereConditions.push('type = ?');
        params.push(type);
      }

      if (categoryId) {
        whereConditions.push('category_id = ?');
        params.push(categoryId);
      }

      if (status !== null) {
        whereConditions.push('status = ?');
        params.push(status);
      }

      const result = await this.paginate({
        where: whereConditions.join(' AND '),
        whereParams: params,
        orderBy,
        pageIndex,
        pageSize
      });

      return {
        success: true,
        ...result
      };
    } catch (error) {
      return {
        success: false,
        error: 'SEARCH_FAILED',
        message: '搜索失败'
      };
    }
  }

  /**
   * 增加下载次数
   */
  async incrementDownloadCount(resourceId) {
    try {
      const db = await this.getDatabase();
      const sql = `
        UPDATE ${this.tableName} 
        SET download_count = download_count + 1, update_time = NOW() 
        WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
      `;
      await db.query(sql, [resourceId]);

      return {
        success: true,
        message: '下载次数更新成功'
      };
    } catch (error) {
      return {
        success: false,
        error: 'UPDATE_FAILED',
        message: '下载次数更新失败'
      };
    }
  }

  /**
   * 获取热门资源
   */
  async getPopularResources(options = {}) {
    const {
      limit = 10,
      type = null,
      categoryId = null,
      days = 30
    } = options;

    const whereConditions = [
      '(is_deleted = 0 OR is_deleted IS NULL)',
      'status = ?',
      'create_time >= DATE_SUB(NOW(), INTERVAL ? DAY)'
    ];
    const params = [DATA_STATUS.ENABLED, days];

    if (type) {
      whereConditions.push('type = ?');
      params.push(type);
    }

    if (categoryId) {
      whereConditions.push('category_id = ?');
      params.push(categoryId);
    }

    const db = await this.getDatabase();
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY download_count DESC, create_time DESC 
      LIMIT ?
    `;

    const results = await db.query(sql, [...params, limit]);
    return results.map(result => this.transform(result));
  }

  /**
   * 获取最新资源
   */
  async getLatestResources(options = {}) {
    const {
      limit = 10,
      type = null,
      categoryId = null
    } = options;

    const whereConditions = [
      '(is_deleted = 0 OR is_deleted IS NULL)',
      'status = ?'
    ];
    const params = [DATA_STATUS.ENABLED];

    if (type) {
      whereConditions.push('type = ?');
      params.push(type);
    }

    if (categoryId) {
      whereConditions.push('category_id = ?');
      params.push(categoryId);
    }

    const db = await this.getDatabase();
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY create_time DESC 
      LIMIT ?
    `;

    const results = await db.query(sql, [...params, limit]);
    return results.map(result => this.transform(result));
  }

  /**
   * 批量更新资源状态
   */
  async batchUpdateStatus(resourceIds, status) {
    try {
      if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
        return {
          success: false,
          error: 'INVALID_PARAMS',
          message: '资源ID列表不能为空'
        };
      }

      const db = await this.getDatabase();
      const placeholders = resourceIds.map(() => '?').join(',');
      const sql = `
        UPDATE ${this.tableName} 
        SET status = ?, update_time = NOW() 
        WHERE id IN (${placeholders}) AND (is_deleted = 0 OR is_deleted IS NULL)
      `;

      const result = await db.query(sql, [status, ...resourceIds]);

      return {
        success: true,
        affectedRows: result.affectedRows,
        message: `成功更新${result.affectedRows}个资源状态`
      };
    } catch (error) {
      return {
        success: false,
        error: 'BATCH_UPDATE_FAILED',
        message: '批量更新状态失败'
      };
    }
  }

  /**
   * 获取资源统计
   */
  async getResourceStats() {
    try {
      const db = await this.getDatabase();
      const sql = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 1 THEN 1 END) as active,
          COUNT(CASE WHEN status = 0 THEN 1 END) as inactive,
          COUNT(CASE WHEN type = 'image' THEN 1 END) as images,
          COUNT(CASE WHEN type = 'audio' THEN 1 END) as audios,
          COUNT(CASE WHEN type = 'video' THEN 1 END) as videos,
          COUNT(CASE WHEN type = 'document' THEN 1 END) as documents,
          SUM(file_size) as total_size,
          SUM(download_count) as total_downloads,
          COUNT(CASE WHEN DATE(create_time) = CURDATE() THEN 1 END) as today_new
        FROM ${this.tableName} 
        WHERE (is_deleted = 0 OR is_deleted IS NULL)
      `;

      const result = await db.queryOne(sql);

      return {
        success: true,
        data: {
          total: parseInt(result.total),
          active: parseInt(result.active),
          inactive: parseInt(result.inactive),
          images: parseInt(result.images),
          audios: parseInt(result.audios),
          videos: parseInt(result.videos),
          documents: parseInt(result.documents),
          totalSize: parseInt(result.total_size || 0),
          totalDownloads: parseInt(result.total_downloads || 0),
          todayNew: parseInt(result.today_new)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'STATS_FAILED',
        message: '获取统计信息失败'
      };
    }
  }

  /**
   * 根据用户获取资源
   */
  async getByUser(userId, options = {}) {
    const {
      pageIndex = 1,
      pageSize = 10,
      type = null,
      status = null,
      orderBy = 'create_time DESC'
    } = options;

    const whereConditions = [
      'uploaded_by = ?',
      '(is_deleted = 0 OR is_deleted IS NULL)'
    ];
    const params = [userId];

    if (type) {
      whereConditions.push('type = ?');
      params.push(type);
    }

    if (status !== null) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    return await this.paginate({
      where: whereConditions.join(' AND '),
      whereParams: params,
      orderBy,
      pageIndex,
      pageSize
    });
  }

  /**
   * 获取相关资源（基于分类和标签）
   */
  async getRelatedResources(resourceId, limit = 5) {
    try {
      const resource = await this.find(resourceId);
      if (!resource) {
        return [];
      }

      const db = await this.getDatabase();
      const sql = `
        SELECT *, 
        (CASE 
          WHEN category_id = ? THEN 3 
          ELSE 0 
        END) +
        (CASE 
          WHEN JSON_CONTAINS(tags, ?) THEN 2 
          ELSE 0 
        END) as relevance_score
        FROM ${this.tableName} 
        WHERE id != ? 
        AND (is_deleted = 0 OR is_deleted IS NULL)
        AND status = ?
        ORDER BY relevance_score DESC, download_count DESC, create_time DESC
        LIMIT ?
      `;

      const tags = resource.tags ? JSON.stringify(resource.tags) : '[]';
      const results = await db.query(sql, [
        resource.category_id,
        tags,
        resourceId,
        DATA_STATUS.ENABLED,
        limit
      ]);

      return results.map(result => this.transform(result));
    } catch (error) {
      return [];
    }
  }

  /**
   * 创建资源
   */
  async createResource(resourceData) {
    try {
      // 处理数据
      const processedData = await this.beforeCreate(resourceData);

      // 创建资源
      const result = await this.create(processedData);

      return {
        success: true,
        insertId: result.insertId,
        message: '资源创建成功'
      };
    } catch (error) {
      return {
        success: false,
        error: 'CREATE_FAILED',
        message: '资源创建失败'
      };
    }
  }

  /**
   * 更新资源
   */
  async updateResource(resourceId, resourceData) {
    try {
      // 检查资源是否存在
      const resource = await this.find(resourceId);
      if (!resource) {
        return {
          success: false,
          error: 'RESOURCE_NOT_FOUND',
          message: '资源不存在'
        };
      }

      // 处理数据
      const processedData = await this.beforeCreate(resourceData);

      // 更新资源
      await this.update(resourceId, processedData);

      return {
        success: true,
        message: '资源更新成功'
      };
    } catch (error) {
      return {
        success: false,
        error: 'UPDATE_FAILED',
        message: '资源更新失败'
      };
    }
  }
}

module.exports = Resource;