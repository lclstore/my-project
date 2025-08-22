/**
 * 资源服务类
 * 处理资源相关的业务逻辑
 */

const BaseService = require('../core/BaseService');
const Resource = require('../models/Resource');
const { ERROR_CODES, FILE_TYPES, DATA_STATUS } = require('../config/constants');
const path = require('path');
const fs = require('fs').promises;

class ResourceService extends BaseService {
  constructor() {
    super({
      tableName: 'resource',
      entityName: '资源',
      primaryKey: 'id',
      fieldMapping: {
        'id': 'id',
        'name': 'name',
        'description': 'description',
        'type': 'type',
        'fileUrl': 'file_url',
        'fileSize': 'file_size',
        'mimeType': 'mime_type',
        'duration': 'duration',
        'categoryId': 'category_id',
        'status': 'status',
        'tags': 'tags',
        'metadata': 'metadata',
        'downloadCount': 'download_count',
        'uploadedBy': 'uploaded_by',
        'createTime': 'create_time',
        'updateTime': 'update_time',
        'isDeleted': 'is_deleted'
      },
      searchableFields: ['name', 'description', 'tags']
    });

    this.resourceModel = new Resource();
  }

  /**
   * 创建资源
   */
  async createResource(resourceData) {
    try {
      // 参数验证
      const validation = this.validate(resourceData, {
        name: { required: true, type: 'string', maxLength: 200 },
        description: { required: false, type: 'string', maxLength: 1000 },
        type: { required: false, type: 'string', maxLength: 50 },
        fileUrl: { required: true, type: 'string', maxLength: 500 },
        categoryId: { required: false, type: 'number' },
        uploadedBy: { required: false, type: 'number' }
      });

      if (!validation.valid) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: validation.errors.join(', ')
        };
      }

      const result = await this.resourceModel.createResource(resourceData);
      return result;
    } catch (error) {
      this.logger.error('创建资源失败:', { error: error.message, resourceData });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '创建资源失败'
      };
    }
  }

  /**
   * 更新资源
   */
  async updateResource(resourceId, resourceData) {
    try {
      // 参数验证
      const validation = this.validate(resourceData, {
        name: { required: false, type: 'string', maxLength: 200 },
        description: { required: false, type: 'string', maxLength: 1000 },
        type: { required: false, type: 'string', maxLength: 50 },
        categoryId: { required: false, type: 'number' }
      });

      if (!validation.valid) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: validation.errors.join(', ')
        };
      }

      const result = await this.resourceModel.updateResource(resourceId, resourceData);
      return result;
    } catch (error) {
      this.logger.error('更新资源失败:', { error: error.message, resourceId, resourceData });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '更新资源失败'
      };
    }
  }

  /**
   * 删除资源
   */
  async deleteResource(resourceId) {
    try {
      // 获取资源信息用于删除文件
      const resource = await this.resourceModel.find(resourceId);

      if (!resource) {
        return {
          success: false,
          errCode: ERROR_CODES.RECORD_NOT_FOUND,
          errMessage: '资源不存在'
        };
      }

      // 删除数据库记录
      const result = await this.delete(resourceId);

      if (result.success) {
        // 可选：删除物理文件
        // await this.deletePhysicalFile(resource.file_url);

        return {
          success: true,
          message: '资源删除成功'
        };
      } else {
        return result;
      }
    } catch (error) {
      this.logger.error('删除资源失败:', { error: error.message, resourceId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '删除资源失败'
      };
    }
  }

  /**
   * 获取资源详情
   */
  async getResourceById(resourceId) {
    try {
      const resource = await this.resourceModel.find(resourceId);

      if (!resource) {
        return {
          success: false,
          errCode: ERROR_CODES.RECORD_NOT_FOUND,
          errMessage: '资源不存在'
        };
      }

      // 获取相关资源
      const relatedResources = await this.resourceModel.getRelatedResources(resourceId, 5);

      return {
        success: true,
        data: {
          ...resource,
          relatedResources
        }
      };
    } catch (error) {
      this.logger.error('获取资源详情失败:', { error: error.message, resourceId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取资源详情失败'
      };
    }
  }

  /**
   * 获取资源列表
   */
  async getResourceList(query = {}) {
    try {
      const result = await this.getList(query);
      return result;
    } catch (error) {
      this.logger.error('获取资源列表失败:', { error: error.message, query });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取资源列表失败'
      };
    }
  }

  /**
   * 根据分类获取资源
   */
  async getResourcesByCategory(categoryId, query = {}) {
    try {
      const result = await this.resourceModel.getByCategory(categoryId, {
        pageIndex: query.pageIndex || 1,
        pageSize: query.pageSize || 10,
        status: query.status,
        orderBy: query.orderBy || 'create_time DESC'
      });

      return {
        success: true,
        ...result
      };
    } catch (error) {
      this.logger.error('根据分类获取资源失败:', { error: error.message, categoryId, query });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '根据分类获取资源失败'
      };
    }
  }

  /**
   * 根据类型获取资源
   */
  async getResourcesByType(type, query = {}) {
    try {
      const result = await this.resourceModel.getByType(type, {
        pageIndex: query.pageIndex || 1,
        pageSize: query.pageSize || 10,
        status: query.status,
        orderBy: query.orderBy || 'create_time DESC'
      });

      return {
        success: true,
        ...result
      };
    } catch (error) {
      this.logger.error('根据类型获取资源失败:', { error: error.message, type, query });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '根据类型获取资源失败'
      };
    }
  }

  /**
   * 根据用户获取资源
   */
  async getResourcesByUser(userId, query = {}) {
    try {
      const result = await this.resourceModel.getByUser(userId, {
        pageIndex: query.pageIndex || 1,
        pageSize: query.pageSize || 10,
        type: query.type,
        status: query.status,
        orderBy: query.orderBy || 'create_time DESC'
      });

      return {
        success: true,
        ...result
      };
    } catch (error) {
      this.logger.error('根据用户获取资源失败:', { error: error.message, userId, query });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '根据用户获取资源失败'
      };
    }
  }

  /**
   * 搜索资源
   */
  async searchResources(query = {}) {
    try {
      const result = await this.resourceModel.searchResources(query.keywords, {
        type: query.type,
        categoryId: query.categoryId,
        status: query.status,
        pageIndex: query.pageIndex || 1,
        pageSize: query.pageSize || 10,
        orderBy: query.orderBy || 'create_time DESC'
      });

      return result;
    } catch (error) {
      this.logger.error('搜索资源失败:', { error: error.message, query });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '搜索资源失败'
      };
    }
  }

  /**
   * 获取热门资源
   */
  async getPopularResources(query = {}) {
    try {
      const resources = await this.resourceModel.getPopularResources({
        limit: query.limit || 10,
        type: query.type,
        categoryId: query.categoryId,
        days: query.days || 30
      });

      return {
        success: true,
        data: resources
      };
    } catch (error) {
      this.logger.error('获取热门资源失败:', { error: error.message, query });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取热门资源失败'
      };
    }
  }

  /**
   * 获取最新资源
   */
  async getLatestResources(query = {}) {
    try {
      const resources = await this.resourceModel.getLatestResources({
        limit: query.limit || 10,
        type: query.type,
        categoryId: query.categoryId
      });

      return {
        success: true,
        data: resources
      };
    } catch (error) {
      this.logger.error('获取最新资源失败:', { error: error.message, query });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取最新资源失败'
      };
    }
  }

  /**
   * 下载资源
   */
  async downloadResource(resourceId, userId = null) {
    try {
      // 获取资源信息
      const resource = await this.resourceModel.find(resourceId);

      if (!resource) {
        return {
          success: false,
          errCode: ERROR_CODES.RECORD_NOT_FOUND,
          errMessage: '资源不存在'
        };
      }

      if (resource.status !== DATA_STATUS.ENABLED) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: '资源不可用'
        };
      }

      // 增加下载次数
      await this.resourceModel.incrementDownloadCount(resourceId);

      // 记录下载日志（可选）
      if (userId) {
        // await this.logDownload(resourceId, userId);
      }

      return {
        success: true,
        data: {
          fileUrl: resource.file_url,
          fileName: resource.name,
          fileSize: resource.file_size,
          mimeType: resource.mime_type
        }
      };
    } catch (error) {
      this.logger.error('下载资源失败:', { error: error.message, resourceId, userId });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '下载资源失败'
      };
    }
  }

  /**
   * 批量删除资源
   */
  async batchDeleteResources(resourceIds) {
    try {
      if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: '资源ID列表不能为空'
        };
      }

      // 获取要删除的资源信息（用于删除物理文件）
      const resourcesToDelete = [];
      for (const resourceId of resourceIds) {
        const resource = await this.resourceModel.find(resourceId);
        if (resource) {
          resourcesToDelete.push(resource);
        }
      }

      // 批量删除数据库记录
      const result = await this.batchDelete(resourceIds);

      if (result.success) {
        // 可选：删除物理文件
        // for (const resource of resourcesToDelete) {
        //   await this.deletePhysicalFile(resource.file_url);
        // }

        return {
          success: true,
          deletedCount: result.deletedCount,
          message: `成功删除${result.deletedCount}个资源`
        };
      } else {
        return result;
      }
    } catch (error) {
      this.logger.error('批量删除资源失败:', { error: error.message, resourceIds });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '批量删除资源失败'
      };
    }
  }

  /**
   * 批量更新资源状态
   */
  async batchUpdateStatus(resourceIds, status) {
    try {
      const result = await this.resourceModel.batchUpdateStatus(resourceIds, status);
      return result;
    } catch (error) {
      this.logger.error('批量更新资源状态失败:', { error: error.message, resourceIds, status });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '批量更新资源状态失败'
      };
    }
  }

  /**
   * 获取资源统计信息
   */
  async getResourceStats() {
    try {
      const result = await this.resourceModel.getResourceStats();
      return result;
    } catch (error) {
      this.logger.error('获取资源统计失败:', { error: error.message });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取资源统计失败'
      };
    }
  }

  /**
   * 获取资源类型统计
   */
  async getResourceTypeStats() {
    try {
      const db = await this.getDatabase();
      const sql = `
        SELECT 
          type,
          COUNT(*) as count,
          SUM(file_size) as total_size,
          SUM(download_count) as total_downloads
        FROM ${this.tableName}
        WHERE (is_deleted = 0 OR is_deleted IS NULL)
        AND status = ?
        GROUP BY type
        ORDER BY count DESC
      `;

      const results = await db.query(sql, [DATA_STATUS.ENABLED]);

      return {
        success: true,
        data: results.map(result => ({
          type: result.type,
          count: parseInt(result.count),
          totalSize: parseInt(result.total_size || 0),
          totalDownloads: parseInt(result.total_downloads || 0)
        }))
      };
    } catch (error) {
      this.logger.error('获取资源类型统计失败:', { error: error.message });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '获取资源类型统计失败'
      };
    }
  }

  /**
   * 处理文件上传
   */
  async handleFileUpload(fileData, userId = null) {
    try {
      // 验证文件数据
      if (!fileData || !fileData.buffer || !fileData.originalname) {
        return {
          success: false,
          errCode: ERROR_CODES.VALIDATION_ERROR,
          errMessage: '文件数据无效'
        };
      }

      // 生成文件名和路径
      const fileExtension = path.extname(fileData.originalname);
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
      const uploadDir = path.join(__dirname, '../../storage/uploads');
      const filePath = path.join(uploadDir, fileName);
      const fileUrl = `/uploads/${fileName}`;

      // 确保上传目录存在
      await fs.mkdir(uploadDir, { recursive: true });

      // 保存文件
      await fs.writeFile(filePath, fileData.buffer);

      // 创建资源记录
      const resourceData = {
        name: fileData.originalname,
        file_url: fileUrl,
        file_size: fileData.size,
        mime_type: fileData.mimetype,
        uploaded_by: userId
      };

      const result = await this.createResource(resourceData);

      if (result.success) {
        return {
          success: true,
          data: {
            id: result.insertId,
            fileName: fileName,
            fileUrl: fileUrl,
            fileSize: fileData.size,
            mimeType: fileData.mimetype
          },
          message: '文件上传成功'
        };
      } else {
        // 如果创建资源记录失败，删除已上传的文件
        await fs.unlink(filePath).catch(() => {});
        return result;
      }
    } catch (error) {
      this.logger.error('文件上传失败:', { error: error.message, fileData });
      return {
        success: false,
        errCode: ERROR_CODES.INTERNAL_ERROR,
        errMessage: '文件上传失败'
      };
    }
  }

  /**
   * 删除物理文件
   */
  async deletePhysicalFile(fileUrl) {
    try {
      if (!fileUrl) {return;}

      // 从URL获取文件路径
      const fileName = path.basename(fileUrl);
      const filePath = path.join(__dirname, '../../storage/uploads', fileName);

      // 检查文件是否存在并删除
      await fs.access(filePath);
      await fs.unlink(filePath);

      this.logger.info('物理文件删除成功:', { fileUrl, filePath });
    } catch (error) {
      // 文件不存在或删除失败，记录警告但不抛出错误
      this.logger.warn('删除物理文件失败:', { error: error.message, fileUrl });
    }
  }

  /**
   * 验证文件类型
   */
  validateFileType(mimeType, allowedTypes = []) {
    if (allowedTypes.length === 0) {
      return true;
    }

    return allowedTypes.some(type => {
      if (type === FILE_TYPES.IMAGE) {
        return mimeType.startsWith('image/');
      } else if (type === FILE_TYPES.AUDIO) {
        return mimeType.startsWith('audio/');
      } else if (type === FILE_TYPES.VIDEO) {
        return mimeType.startsWith('video/');
      } else if (type === FILE_TYPES.DOCUMENT) {
        return mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text');
      } else {
        return mimeType.includes(type);
      }
    });
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(fileUrl) {
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(__dirname, '../../storage/uploads', fileName);

      const stats = await fs.stat(filePath);

      return {
        exists: true,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    } catch (error) {
      return {
        exists: false,
        error: error.message
      };
    }
  }
}

module.exports = ResourceService;