/**
 * 路由入口文件
 * 统一管理所有API路由
 */

const express = require('express');
const { specs, swaggerUi, swaggerUiOptions } = require('../config/swagger');

// 导入中间件
const { authMiddleware } = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');
const { apiRateLimiter } = require('../middleware/rateLimiter');

// 导入控制器
const UserController = require('../controllers/UserController');
const CategoryController = require('../controllers/CategoryController');
const ExerciseController = require('../controllers/ExerciseController');
const SoundController = require('../controllers/SoundController');
const FilesController = require('../controllers/FilesController');
const EnumController = require('../controllers/EnumController');
const HomeController = require('../controllers/HomeController');
const WorkoutController = require('../controllers/WorkoutController');
const ProgramController = require('../controllers/ProgramController');
const MusicController = require('../controllers/MusicController');
const TemplateController = require('../controllers/TemplateController');
const PublishController = require('../controllers/PublishController');

const router = express.Router();

// 创建控制器实例
const userController = new UserController();
const categoryController = new CategoryController();
const exerciseController = new ExerciseController();
const soundController = new SoundController();
const filesController = new FilesController();
const enumController = new EnumController();
const homeController = new HomeController();
const workoutController = new WorkoutController();
const programController = new ProgramController();
const musicController = new MusicController();
const templateController = new TemplateController();
const publishController = new PublishController();

// Swagger文档路由（公开访问）
router.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

// API文档JSON格式
router.get('/swagger.json', (req, res) => {
  res.json(specs);
});

// 健康检查接口（公开访问）
router.get('/health', (req, res) => {
  res.success({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  });
});

// 系统信息接口（公开访问）
router.get('/info', (req, res) => {
  res.success({
    name: 'Backend API',
    version: '2.0.0',
    description: '企业级后台管理系统API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 应用限流中间件
router.use(apiRateLimiter);

// 公开路由（不需要认证）
const publicRoutes = express.Router();

// 用户认证相关路由
publicRoutes.post('/user/login', userController.login.bind(userController));
publicRoutes.post('/user/register', userController.register.bind(userController));
publicRoutes.post('/user/refresh-token', userController.refreshToken.bind(userController));
publicRoutes.post('/user/check-email', userController.checkEmailAvailable.bind(userController));

// 分类公开查询路由
publicRoutes.get('/category/tree', categoryController.getCategoryTree.bind(categoryController));
publicRoutes.get('/category/top', categoryController.getTopCategories.bind(categoryController));
publicRoutes.get('/category/:id', categoryController.getCategoryById.bind(categoryController));
publicRoutes.get('/category/:id/children', categoryController.getChildren.bind(categoryController));
publicRoutes.get('/category/:id/breadcrumb', categoryController.getBreadcrumb.bind(categoryController));

// 注册公开路由
router.use(publicRoutes);

// 认证中间件（应用到下面所有路由）
router.use(authMiddleware);

// 需要认证的路由

// 用户相关路由
const userRoutes = express.Router();

// 用户个人操作
userRoutes.get('/profile', userController.getProfile.bind(userController));
userRoutes.get('/getMyInfo', userController.getProfile.bind(userController)); // 兼容原接口路径
userRoutes.put('/profile', userController.updateProfile.bind(userController));
userRoutes.post('/change-password', userController.changePassword.bind(userController));
userRoutes.post('/logout', userController.logout.bind(userController));

// 用户管理操作（需要管理员权限）
userRoutes.get('/list', userController.getUserList.bind(userController));
userRoutes.get('/search', userController.searchUsers.bind(userController));
userRoutes.get('/stats', userController.getUserStats.bind(userController));
userRoutes.get('/online', userController.getOnlineUsers.bind(userController));
userRoutes.get('/:id', userController.getUserById.bind(userController));
userRoutes.post('/', userController.createUser.bind(userController));
userRoutes.put('/:id', userController.updateUser.bind(userController));
userRoutes.delete('/:id', userController.deleteUser.bind(userController));
userRoutes.post('/batch-delete', userController.batchDeleteUsers.bind(userController));
userRoutes.post('/batch-update-status', userController.batchUpdateStatus.bind(userController));

router.use('/user', userRoutes);

// 分类相关路由
const categoryRoutes = express.Router();

// 分类查询操作
categoryRoutes.get('/list', categoryController.getCategoryList.bind(categoryController));
categoryRoutes.get('/all', categoryController.getAllCategories.bind(categoryController));
categoryRoutes.get('/search', categoryController.searchCategories.bind(categoryController));
categoryRoutes.get('/stats', categoryController.getCategoryStats.bind(categoryController));
categoryRoutes.get('/:id/path', categoryController.getCategoryPath.bind(categoryController));

// 分类管理操作
categoryRoutes.post('/', categoryController.createCategory.bind(categoryController));
categoryRoutes.put('/:id', categoryController.updateCategory.bind(categoryController));
categoryRoutes.delete('/:id', categoryController.deleteCategory.bind(categoryController));
categoryRoutes.post('/batch-sort', categoryController.batchUpdateSort.bind(categoryController));
categoryRoutes.post('/batch-delete', categoryController.batchDeleteCategories.bind(categoryController));
categoryRoutes.post('/batch-update-status', categoryController.batchUpdateStatus.bind(categoryController));
categoryRoutes.post('/:id/move', categoryController.moveCategory.bind(categoryController));
categoryRoutes.post('/:id/copy', categoryController.copyCategory.bind(categoryController));
categoryRoutes.post('/check-name', categoryController.checkNameAvailable.bind(categoryController));

router.use('/category', categoryRoutes);

// 动作资源相关路由
const exerciseRoutes = express.Router();

// 动作资源查询操作
exerciseRoutes.get('/page', exerciseController.getPage.bind(exerciseController));
exerciseRoutes.get('/detail/:id', exerciseController.getDetail.bind(exerciseController));

// 动作资源管理操作
exerciseRoutes.post('/save', exerciseController.save.bind(exerciseController));
exerciseRoutes.post('/enable', exerciseController.enable.bind(exerciseController));
exerciseRoutes.post('/disable', exerciseController.disable.bind(exerciseController));
exerciseRoutes.post('/del', exerciseController.del.bind(exerciseController));

router.use('/exercise', exerciseRoutes);

// 音频资源相关路由
const soundRoutes = express.Router();

// 音频资源查询操作
soundRoutes.get('/page', soundController.getPage.bind(soundController));
soundRoutes.get('/detail/:id', soundController.getDetail.bind(soundController));

// 音频资源管理操作
soundRoutes.post('/save', soundController.save.bind(soundController));
soundRoutes.post('/enable', soundController.enable.bind(soundController));
soundRoutes.post('/disable', soundController.disable.bind(soundController));
soundRoutes.post('/del', soundController.del.bind(soundController));

router.use('/sound', soundRoutes);

// 文件上传相关路由
const filesRoutes = express.Router();

// 文件上传操作
filesRoutes.post('/upload', filesController.uploadSingle.bind(filesController));
filesRoutes.post('/upload-multiple', filesController.uploadMultiple.bind(filesController));

router.use('/files', filesRoutes);

// 枚举相关路由
const enumRoutes = express.Router();

// 枚举查询操作
enumRoutes.get('/all', enumController.getAllEnums.bind(enumController));
enumRoutes.get('/list', enumController.getAllEnums.bind(enumController)); // 兼容原接口路径
enumRoutes.get('/types', enumController.getEnumTypes.bind(enumController));
enumRoutes.get('/:type', enumController.getEnumByType.bind(enumController));

router.use('/enum', enumRoutes);

// 首页相关路由
const homeRoutes = express.Router();

// 首页操作
homeRoutes.get('/dashboard', homeController.getDashboard.bind(homeController));
homeRoutes.get('/system-info', homeController.getSystemInfo.bind(homeController));
homeRoutes.get('/info', homeController.getAppInfo.bind(homeController)); // 兼容原接口路径
homeRoutes.get('/health', homeController.healthCheck.bind(homeController));
homeRoutes.get('/welcome', homeController.welcome.bind(homeController));

// 帮助相关接口
homeRoutes.get('/helps/page', homeController.getHelpsPage.bind(homeController));
homeRoutes.post('/addHelps', homeController.addHelps.bind(homeController));

// 变更日志相关接口
homeRoutes.get('/changelogs/page', homeController.getChangeLogsPage.bind(homeController));
homeRoutes.post('/addChangeLogs', homeController.addChangeLogs.bind(homeController));

// 应用信息保存接口
homeRoutes.post('/save', homeController.saveAppInfo.bind(homeController));

router.use('/home', homeRoutes);

// 训练相关路由
const workoutRoutes = express.Router();

// 训练查询操作
workoutRoutes.get('/page', workoutController.getPage.bind(workoutController));
workoutRoutes.get('/detail/:id', workoutController.getDetail.bind(workoutController));

// 训练管理操作
workoutRoutes.post('/save', workoutController.save.bind(workoutController));
workoutRoutes.post('/enable', workoutController.enable.bind(workoutController));
workoutRoutes.post('/disable', workoutController.disable.bind(workoutController));
workoutRoutes.post('/del', workoutController.del.bind(workoutController));

router.use('/workout', workoutRoutes);

// 训练计划相关路由
const programRoutes = express.Router();

// 训练计划查询操作
programRoutes.get('/page', programController.getPage.bind(programController));
programRoutes.get('/detail/:id', programController.getDetail.bind(programController));

// 训练计划管理操作
programRoutes.post('/save', programController.save.bind(programController));
programRoutes.post('/enable', programController.enable.bind(programController));
programRoutes.post('/disable', programController.disable.bind(programController));
programRoutes.post('/del', programController.del.bind(programController));

router.use('/program', programRoutes);

// 音乐相关路由
const musicRoutes = express.Router();

// 音乐查询操作
musicRoutes.get('/page', musicController.getPage.bind(musicController));
musicRoutes.get('/detail/:id', musicController.getDetail.bind(musicController));

// 音乐管理操作
musicRoutes.post('/save', musicController.save.bind(musicController));
musicRoutes.post('/enable', musicController.enable.bind(musicController));
musicRoutes.post('/disable', musicController.disable.bind(musicController));
musicRoutes.post('/del', musicController.del.bind(musicController));

router.use('/music', musicRoutes);

// 模板相关路由
const templateRoutes = express.Router();

// 模板查询操作
templateRoutes.get('/page', templateController.getPage.bind(templateController));
templateRoutes.get('/detail/:id', templateController.getDetail.bind(templateController));

// 模板管理操作
templateRoutes.post('/save', templateController.save.bind(templateController));
templateRoutes.post('/enable', templateController.enable.bind(templateController));
templateRoutes.post('/disable', templateController.disable.bind(templateController));
templateRoutes.post('/del', templateController.del.bind(templateController));

router.use('/template', templateRoutes);

// 发布管理相关路由
const publishRoutes = express.Router();

// 发布查询操作
publishRoutes.get('/page', publishController.getPage.bind(publishController));
publishRoutes.get('/detail/:id', publishController.getDetail.bind(publishController));

// 发布管理操作
publishRoutes.post('/publish', publishController.createPublish.bind(publishController));
publishRoutes.put('/update/:id', publishController.updateStatus.bind(publishController));

router.use('/publish', publishRoutes);

// 其他模块路由可以在这里继续添加
// 注意：以下路由已经添加：
// - /user (用户管理)
// - /category (分类管理)
// - /exercise (动作资源管理)
// - /sound (音频资源管理)
// - /files (文件上传)
// - /enum (枚举值)
// - /home (首页和系统信息)
// - /workout (训练管理) ✅ 已添加
// - /program (训练计划管理) ✅ 已添加
// - /music (音乐管理) ✅ 已添加
// - /template (模板管理) ✅ 已添加
//
// 待添加的路由：
// - /resource (资源管理)
// - /playlist (播放列表管理)
// - /opLogs (操作日志)
// - /planNameSettings (计划名称设置)
// - /planReplaceSettings (计划替换设置)
// - /workoutSettings (训练设置) ✅ 已添加
// - /data (通用数据接口)
// - /publish (发布管理)

// 训练设置路由
const WorkoutSettingsController = require('../controllers/WorkoutSettingsController');
const workoutSettingsController = new WorkoutSettingsController();

router.get('/workoutSettings/detail', (req, res) => workoutSettingsController.detail(req, res));
router.post('/workoutSettings/save', (req, res) => workoutSettingsController.save(req, res));
router.put('/workoutSettings/update', (req, res) => workoutSettingsController.update(req, res));

// 兜底路由 - 404处理
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    errCode: 'API_NOT_FOUND',
    errMessage: `接口 ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;