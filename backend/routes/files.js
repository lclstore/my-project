const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { DatabaseHelper, FileHelper } = require('../config/database');

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许的文件类型
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
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
 *                     fileId:
 *                       type: integer
 *                       description: 文件ID
 *                     originalName:
 *                       type: string
 *                       description: 原始文件名
 *                     fileName:
 *                       type: string
 *                       description: 存储文件名
 *                     fileSize:
 *                       type: integer
 *                       description: 文件大小
 *                     mimeType:
 *                       type: string
 *                       description: 文件类型
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
// 文件上传接口
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    // 保存文件信息到数据库
    const fileData = {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user?.userId || null // 如果有用户认证
    };

    const result = await FileHelper.saveFileInfo(fileData);

    res.json({
      success: true,
      message: '文件上传成功',
      data: {
        fileId: result.insertId,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
    });
  }
});

// 批量文件上传接口
router.post('/upload-multiple', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    const uploadResults = [];

    for (const file of req.files) {
      try {
        const fileData = {
          originalName: file.originalname,
          fileName: file.filename,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedBy: req.user?.userId || null
        };

        const result = await FileHelper.saveFileInfo(fileData);

        uploadResults.push({
          success: true,
          fileId: result.insertId,
          originalName: file.originalname,
          fileName: file.filename
        });
      } catch (error) {
        uploadResults.push({
          success: false,
          originalName: file.originalname,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: '批量上传完成',
      data: uploadResults
    });

  } catch (error) {
    console.error('批量文件上传错误:', error);
    res.status(500).json({
      success: false,
      message: '批量文件上传失败',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/files/download/{fileId}:
 *   get:
 *     summary: 文件下载
 *     description: 根据文件ID下载文件
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 文件ID
 *     responses:
 *       200:
 *         description: 文件下载成功
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: 文件不存在
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
// 文件下载接口
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    // 获取文件信息
    const fileResult = await FileHelper.getFileInfo(fileId);

    if (!fileResult.success || !fileResult.data) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    const fileInfo = fileResult.data;
    const filePath = fileInfo.file_path;

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '文件已被删除'
      });
    }

    // 更新下载次数
    await FileHelper.incrementDownloadCount(fileId);

    // 设置响应头
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileInfo.original_name)}"`);
    res.setHeader('Content-Type', fileInfo.mime_type);
    res.setHeader('Content-Length', fileInfo.file_size);

    // 发送文件
    res.sendFile(path.resolve(filePath));

  } catch (error) {
    console.error('文件下载错误:', error);
    res.status(500).json({
      success: false,
      message: '文件下载失败',
      error: error.message
    });
  }
});

// 获取文件列表接口
router.get('/list', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      userId = null
    } = req.query;

    let result;

    if (userId) {
      // 获取指定用户的文件
      result = await FileHelper.getUserFiles(userId, {
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
    } else {
      // 获取所有文件
      result = await DatabaseHelper.select('files', {
        orderBy: 'upload_time DESC',
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize)
      });
    }

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: result.count
      }
    });

  } catch (error) {
    console.error('获取文件列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取文件列表失败',
      error: error.message
    });
  }
});

// 删除文件接口
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user?.userId; // 如果有用户认证

    // 获取文件信息
    const fileResult = await FileHelper.getFileInfo(fileId);

    if (!fileResult.success || !fileResult.data) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    const fileInfo = fileResult.data;

    // 删除物理文件
    if (fs.existsSync(fileInfo.file_path)) {
      fs.unlinkSync(fileInfo.file_path);
    }

    // 删除数据库记录
    const deleteResult = await FileHelper.deleteFileRecord(fileId, userId);

    if (deleteResult.affectedRows === 0) {
      return res.status(403).json({
        success: false,
        message: '没有权限删除此文件'
      });
    }

    res.json({
      success: true,
      message: '文件删除成功'
    });

  } catch (error) {
    console.error('删除文件错误:', error);
    res.status(500).json({
      success: false,
      message: '删除文件失败',
      error: error.message
    });
  }
});

// 获取文件信息接口
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    const result = await FileHelper.getFileInfo(fileId);

    if (!result.success || !result.data) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('获取文件信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取文件信息失败',
      error: error.message
    });
  }
});

module.exports = router;
