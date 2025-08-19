# Cloudinary 文件上传配置指南

## 📋 概述

本项目已集成 Cloudinary 作为文件上传服务，支持图片、音频、视频等多种文件类型的上传和管理。

## 🚀 快速开始

### 1. 注册 Cloudinary 账户

1. 访问 [Cloudinary 官网](https://cloudinary.com/)
2. 点击 "Sign up for free" 注册免费账户
3. 验证邮箱并登录

### 2. 获取 API 凭证

1. 登录后进入 Dashboard
2. 在 "Account Details" 部分找到：
   - **Cloud name**: 你的云名称
   - **API Key**: API 密钥
   - **API Secret**: API 密钥（点击眼睛图标显示）

### 3. 配置环境变量

在项目根目录的 `.env` 文件中添加：

```env
# Cloudinary配置
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. 安装依赖

```bash
npm install cloudinary
```

### 5. 测试配置

```bash
node utils/cloudinaryTest.js
```

## 📊 免费额度

Cloudinary 免费账户提供：
- **存储空间**: 25 GB
- **月流量**: 25 GB
- **转换次数**: 25,000 次/月
- **API 请求**: 1,000,000 次/月

## 🔧 API 使用

### 上传文件

```bash
POST /templateCms/web/files/upload
Content-Type: multipart/form-data

# 表单数据
file: [选择文件]
```

### 响应格式

```json
{
  "success": true,
  "message": "文件上传成功",
  "data": {
    "fileId": 123,
    "originalName": "example.jpg",
    "fileName": "uploads/1234567890_example",
    "fileSize": 102400,
    "mimeType": "image/jpeg",
    "cloudinaryUrl": "https://res.cloudinary.com/your_cloud/image/upload/v1234567890/uploads/1234567890_example.jpg",
    "cloudinaryId": "uploads/1234567890_example",
    "thumbnailUrl": "https://res.cloudinary.com/your_cloud/image/upload/c_thumb,w_200,h_200/v1234567890/uploads/1234567890_example.jpg"
  }
}
```

## 🎯 支持的文件类型

### 图片
- JPEG, PNG, GIF, WebP, BMP, SVG

### 音频
- MP3, WAV, MP4, OGG

### 视频
- MP4, MPEG, QuickTime, WebM

### 文档
- PDF, TXT, DOC, DOCX, JSON, CSV

## 🛠️ 高级功能

### 图片变换

Cloudinary 支持实时图片变换：

```javascript
// 生成缩略图
const thumbnailUrl = cloudinary.url(publicId, {
  width: 200,
  height: 200,
  crop: 'thumb'
});

// 自动优化
const optimizedUrl = cloudinary.url(publicId, {
  fetch_format: 'auto',
  quality: 'auto'
});
```

### 文件夹组织

文件会自动存储在 `uploads/` 文件夹中，你可以根据需要修改：

```javascript
// 在 routes/files.js 中修改
folder: 'uploads/images', // 图片文件夹
folder: 'uploads/audio',  // 音频文件夹
folder: 'uploads/docs',   // 文档文件夹
```

## 🔍 故障排除

### 常见错误

1. **Invalid API key**
   - 检查 `CLOUDINARY_API_KEY` 是否正确
   - 确保没有多余的空格

2. **Invalid cloud name**
   - 检查 `CLOUDINARY_CLOUD_NAME` 是否正确
   - 云名称通常是小写字母和数字

3. **File size too large**
   - 免费账户单文件限制 10MB
   - 可以在代码中调整 multer 限制

4. **Unsupported file type**
   - 检查文件类型是否在允许列表中
   - 在 `fileFilter` 中添加新的 MIME 类型

### 调试步骤

1. 运行配置测试：
   ```bash
   node utils/cloudinaryTest.js
   ```

2. 检查环境变量：
   ```bash
   echo $CLOUDINARY_CLOUD_NAME
   ```

3. 查看上传日志：
   ```bash
   # 服务器日志会显示详细的上传信息
   npm run dev
   ```

## 📈 监控和管理

### Dashboard 功能

在 Cloudinary Dashboard 中可以：
- 查看存储使用情况
- 管理上传的文件
- 设置上传预设
- 查看 API 使用统计

### 文件管理

```javascript
// 删除文件
await cloudinary.uploader.destroy(publicId);

// 获取文件信息
const info = await cloudinary.api.resource(publicId);

// 列出文件
const files = await cloudinary.api.resources({
  type: 'upload',
  prefix: 'uploads/'
});
```

## 🔐 安全建议

1. **保护 API 密钥**
   - 不要将 API Secret 提交到版本控制
   - 使用环境变量存储敏感信息

2. **设置上传限制**
   - 限制文件大小和类型
   - 设置用户上传配额

3. **使用签名上传**
   - 对于敏感文件使用签名上传
   - 验证上传来源

## 📚 更多资源

- [Cloudinary 官方文档](https://cloudinary.com/documentation)
- [Node.js SDK 文档](https://cloudinary.com/documentation/node_integration)
- [图片变换指南](https://cloudinary.com/documentation/image_transformations)
