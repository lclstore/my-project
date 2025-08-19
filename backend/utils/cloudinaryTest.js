/**
 * Cloudinary 配置测试工具
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * 测试 Cloudinary 配置
 */
async function testCloudinaryConfig() {
  console.log('🧪 测试 Cloudinary 配置');
  console.log('=' .repeat(50));

  // 检查环境变量
  const requiredEnvs = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

  if (missingEnvs.length > 0) {
    console.log('❌ 缺少环境变量:', missingEnvs.join(', '));
    console.log('💡 请在 .env 文件中配置以下变量:');
    missingEnvs.forEach(env => {
      console.log(`   ${env}=your_value_here`);
    });
    return false;
  }

  console.log('✅ 环境变量配置完整');
  console.log('📋 配置信息:');
  console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY?.substring(0, 6)}...`);
  console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET?.substring(0, 6)}...`);

  try {
    // 测试 API 连接
    console.log('\n🔗 测试 API 连接...');
    const result = await cloudinary.api.ping();
    console.log('✅ API 连接成功:', result);

    // 获取账户信息
    console.log('\n📊 获取账户信息...');
    const usage = await cloudinary.api.usage();
    console.log('✅ 账户信息:');
    console.log(`   存储使用: ${(usage.storage.used_bytes / 1024 / 1024).toFixed(2)} MB / ${(usage.storage.limit / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   本月转换: ${usage.transformations.used} / ${usage.transformations.limit}`);
    console.log(`   本月请求: ${usage.requests.used} / ${usage.requests.limit}`);

    return true;

  } catch (error) {
    console.error('❌ Cloudinary 连接失败:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.log('💡 请检查 CLOUDINARY_API_KEY 是否正确');
    } else if (error.message.includes('Invalid API secret')) {
      console.log('💡 请检查 CLOUDINARY_API_SECRET 是否正确');
    } else if (error.message.includes('Invalid cloud name')) {
      console.log('💡 请检查 CLOUDINARY_CLOUD_NAME 是否正确');
    }
    
    return false;
  }
}

/**
 * 测试文件上传
 */
async function testFileUpload() {
  console.log('\n📤 测试文件上传...');
  
  try {
    // 创建一个测试图片的 base64 数据
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const result = await cloudinary.uploader.upload(testImageBase64, {
      folder: 'test',
      public_id: 'test_upload_' + Date.now(),
      resource_type: 'image'
    });

    console.log('✅ 测试上传成功:');
    console.log(`   Public ID: ${result.public_id}`);
    console.log(`   URL: ${result.secure_url}`);
    console.log(`   Size: ${result.bytes} bytes`);

    // 删除测试文件
    await cloudinary.uploader.destroy(result.public_id);
    console.log('✅ 测试文件已清理');

    return true;

  } catch (error) {
    console.error('❌ 测试上传失败:', error.message);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始 Cloudinary 测试\n');

  const configTest = await testCloudinaryConfig();
  
  if (configTest) {
    await testFileUpload();
  }

  console.log('\n🎉 测试完成');
  
  if (!configTest) {
    console.log('\n📝 Cloudinary 设置步骤:');
    console.log('1. 访问 https://cloudinary.com/ 注册免费账户');
    console.log('2. 在 Dashboard 中找到 Account Details');
    console.log('3. 复制 Cloud name, API Key, API Secret');
    console.log('4. 在 .env 文件中配置这些值');
    console.log('5. 重新运行测试');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testCloudinaryConfig,
  testFileUpload
};
