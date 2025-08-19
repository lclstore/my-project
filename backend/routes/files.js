const express = require('express');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const router = express.Router();

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

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
});

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: 单文件上传
 *     description: 上传单个文件到服务器
 *     tags: [Files]
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
 *                       example: "888.mp3"
 *                     fileName:
 *                       type: string
 *                       description: Cloudinary 文件名
 *                       example: "uploads/1234567890_888"
 *                     fileSize:
 *                       type: integer
 *                       description: 文件大小（字节）
 *                       example: 102400
 *                     mimeType:
 *                       type: string
 *                       description: 文件类型
 *                       example: "audio/mpeg"
 *                     cloudinaryUrl:
 *                       type: string
 *                       description: Cloudinary 文件URL
 *                       example: "https://res.cloudinary.com/xxx/raw/upload/v1234567890/uploads/1234567890_888.mp3"
 *                     cloudinaryId:
 *                       type: string
 *                       description: Cloudinary 公共ID
 *                       example: "uploads/1234567890_888"
 *                     resourceType:
 *                       type: string
 *                       description: 资源类型
 *                       example: "raw"
 *                     format:
 *                       type: string
 *                       description: 文件格式
 *                       example: "mp3"
 *       400:
 *         description: 没有上传文件
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// 文件上传接口（使用 Cloudinary）
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    console.log('开始上传文件到 Cloudinary:', req.file.originalname);

    // 上传到 Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto', // 自动检测文件类型
          folder: 'uploads', // 存储在 uploads 文件夹
          public_id: `${Date.now()}_${path.parse(req.file.originalname).name}`, // 生成唯一ID
          use_filename: true,
          unique_filename: false
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary 上传错误:', error);
            reject(error);
          } else {
            console.log('Cloudinary 上传成功:', result.public_id);
            resolve(result);
          }
        }
      );

      // 将文件缓冲区写入上传流
      uploadStream.end(req.file.buffer);
    });

    // 直接返回 Cloudinary 上传结果给前端
    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        originalName: req.file.originalname,
        fileName: uploadResult.public_id,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        fileUrl: uploadResult.secure_url,
        uploadUrl: uploadResult.secure_url,
        fileRelativeUrl: uploadResult.public_id,
        resourceType: uploadResult.resource_type,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        duration: uploadResult.duration, // 音频/视频时长
        createdAt: uploadResult.created_at
      }
    });

  } catch (error) {
    console.error('文件上传错误:', error);

    // 根据错误类型返回不同的错误信息
    if (error.message && error.message.includes('File size too large')) {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制',
        error: error.message
      });
    }

    if (error.message && error.message.includes('Invalid image file')) {
      return res.status(400).json({
        success: false,
        message: '无效的文件格式',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
    });
  }
});



module.exports = router;
