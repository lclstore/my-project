/**
 * 文件上传控制器
 * 处理文件上传相关的HTTP请求
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const Logger = require('../core/Logger');

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class FilesController {
  constructor() {
    this.logger = new Logger();
    this.setupMulter();
  }

  /**
   * 配置multer
   */
  setupMulter() {
    // 配置multer使用内存存储（用于Cloudinary上传）
    const storage = multer.memoryStorage();

    // 文件过滤器
    const fileFilter = (req, file, cb) => {
      // 允许的文件类型
      const allowedTypes = [
        // 图片类型
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/bmp',
        'image/svg+xml',
        // 音频类型
        'audio/mpeg',
        'audio/wav',
        'audio/mp3',
        'audio/mp4',
        'audio/ogg',
        // 视频类型
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/webm',
        // 文档类型
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // 其他类型
        'application/json',
        'text/csv'
      ];

      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
      }
    };

    this.upload = multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB限制
      }
    });
  }

  /**
   * @swagger
   * /files/upload:
   *   post:
   *     tags: [Files]
   *     summary: 单文件上传
   *     description: 上传单个文件到服务器
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *                 description: 要上传的文件
   *     responses:
   *       200:
   *         description: 文件上传成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "文件上传成功"
   *                 data:
   *                   type: object
   *                   properties:
   *                     originalName:
   *                       type: string
   *                       description: 原始文件名
   *                       example: "example.jpg"
   *                     fileName:
   *                       type: string
   *                       description: 服务器文件名
   *                       example: "1234567890_example.jpg"
   *                     url:
   *                       type: string
   *                       description: 文件访问URL
   *                       example: "https://res.cloudinary.com/demo/image/upload/v1234567890/example.jpg"
   *                     size:
   *                       type: integer
   *                       description: 文件大小（字节）
   *                       example: 1024000
   *                     mimeType:
   *                       type: string
   *                       description: 文件MIME类型
   *                       example: "image/jpeg"
   *       400:
   *         description: 请求错误
   *       413:
   *         description: 文件过大
   *       500:
   *         description: 服务器错误
   */
  async uploadSingle(req, res) {
    try {
      // 使用multer中间件处理文件上传
      this.upload.single('file')(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.error('FILE_TOO_LARGE', '文件大小超过限制（最大10MB）', 413);
            }
            return res.error('UPLOAD_ERROR', err.message, 400);
          }
          return res.error('UPLOAD_ERROR', err.message, 400);
        }

        if (!req.file) {
          return res.error('NO_FILE', '请选择要上传的文件', 400);
        }

        try {
          // 上传到Cloudinary
          const result = await this.uploadToCloudinary(req.file);

          return res.success({
            originalName: req.file.originalname,
            fileName: result.public_id,
            url: result.secure_url,
            size: req.file.size,
            mimeType: req.file.mimetype,
            cloudinaryId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format
          }, '文件上传成功');

        } catch (uploadError) {
          this.logger.error('文件上传到Cloudinary失败:', {
            error: uploadError.message,
            file: req.file.originalname
          });
          return res.error('UPLOAD_FAILED', '文件上传失败', 500);
        }
      });

    } catch (error) {
      this.logger.error('文件上传处理失败:', {
        error: error.message,
        stack: error.stack
      });
      return res.error('INTERNAL_ERROR', '文件上传处理失败', 500);
    }
  }

  /**
   * @swagger
   * /files/upload-multiple:
   *   post:
   *     tags: [Files]
   *     summary: 多文件上传
   *     description: 上传多个文件到服务器
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               files:
   *                 type: array
   *                 items:
   *                   type: string
   *                   format: binary
   *                 description: 要上传的文件数组
   *     responses:
   *       200:
   *         description: 文件上传成功
   *       400:
   *         description: 请求错误
   *       413:
   *         description: 文件过大
   *       500:
   *         description: 服务器错误
   */
  async uploadMultiple(req, res) {
    try {
      // 使用multer中间件处理多文件上传
      this.upload.array('files', 10)(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.error('FILE_TOO_LARGE', '文件大小超过限制（最大10MB）', 413);
            }
            return res.error('UPLOAD_ERROR', err.message, 400);
          }
          return res.error('UPLOAD_ERROR', err.message, 400);
        }

        if (!req.files || req.files.length === 0) {
          return res.error('NO_FILES', '请选择要上传的文件', 400);
        }

        try {
          // 并行上传所有文件到Cloudinary
          const uploadPromises = req.files.map(file => this.uploadToCloudinary(file));
          const results = await Promise.all(uploadPromises);

          const uploadedFiles = results.map((result, index) => ({
            originalName: req.files[index].originalname,
            fileName: result.public_id,
            url: result.secure_url,
            size: req.files[index].size,
            mimeType: req.files[index].mimetype,
            cloudinaryId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format
          }));

          return res.success({
            files: uploadedFiles,
            count: uploadedFiles.length
          }, `成功上传${uploadedFiles.length}个文件`);

        } catch (uploadError) {
          this.logger.error('多文件上传到Cloudinary失败:', {
            error: uploadError.message,
            fileCount: req.files.length
          });
          return res.error('UPLOAD_FAILED', '文件上传失败', 500);
        }
      });

    } catch (error) {
      this.logger.error('多文件上传处理失败:', {
        error: error.message,
        stack: error.stack
      });
      return res.error('INTERNAL_ERROR', '文件上传处理失败', 500);
    }
  }

  /**
   * 上传文件到Cloudinary
   */
  async uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto', // 自动检测文件类型
          folder: 'uploads', // 存储文件夹
          use_filename: true,
          unique_filename: true
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  /**
   * 获取multer中间件
   */
  getUploadMiddleware() {
    return this.upload;
  }
}

module.exports = FilesController;
