# Language 语言模块

## 概述

Language模块提供系统语言管理功能，用于支持多语言国际化需求。该模块包含语言列表查询接口，为前端提供可选的语言选项。

## 数据库设计

### 表结构：language

```sql
CREATE TABLE language (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    code VARCHAR(10) NOT NULL COMMENT '语言编码，如 zh-CN、en-US',
    name VARCHAR(50) NOT NULL COMMENT '语言名称，如 中文、English',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) COMMENT='系统语言表';
```

### 索引设计

- **唯一索引**: `idx_language_code` - 确保语言编码唯一性
- **普通索引**: `idx_language_name` - 优化按名称查询

### 预置数据

系统预置了常用的10种语言：

| 编码 | 名称 |
|------|------|
| zh-CN | 中文 |
| en-US | English |
| ja-JP | 日本語 |
| ko-KR | 한국어 |
| es-ES | Español |
| fr-FR | Français |
| de-DE | Deutsch |
| it-IT | Italiano |
| pt-PT | Português |
| ru-RU | Русский |

## API接口

### 查询语言列表

- **路径**: `GET /api/common/language/list`
- **功能**: 获取系统支持的所有语言列表
- **用途**: 前端语言选择器、国际化配置等

#### 请求示例

```bash
GET /api/common/language/list
```

#### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "zh-CN",
      "name": "中文",
      "createTime": "2025-01-15 10:30:00"
    },
    {
      "id": 2,
      "code": "en-US",
      "name": "English",
      "createTime": "2025-01-15 10:30:00"
    },
    {
      "id": 3,
      "code": "ja-JP",
      "name": "日本語",
      "createTime": "2025-01-15 10:30:00"
    }
  ],
  "message": "查询语言列表成功",
  "errCode": null,
  "errMessage": null
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键ID |
| code | string | 语言编码（ISO 639-1 + ISO 3166-1） |
| name | string | 语言显示名称 |
| createTime | string | 创建时间 |

## 技术实现

### 字段转换

使用 `convertToFrontendFormat` 工具自动处理：
- 数据库字段名（snake_case）→ 前端字段名（camelCase）
- 时间格式标准化

### 错误处理

- 统一的错误响应格式
- 详细的错误日志记录
- 合适的HTTP状态码

### 性能优化

- 数据量小，无需分页
- 使用索引优化查询
- 按创建时间排序保证稳定性

## 部署和使用

### 1. 初始化数据库

```bash
# 创建表和初始数据
node scripts/initLanguageTable.js
```

### 2. 测试功能

```bash
# 数据库功能测试
node test/languageTest.js

# API接口测试（需要先启动服务）
node test/languageApiTest.js
```

### 3. 集成到项目

Language模块已集成到Common公共接口模块中：

```javascript
// 路由注册
app.use('/api/common', commonRoutes);

// 接口访问
GET /api/common/language/list
```

## 使用场景

### 1. 前端语言选择器

```javascript
// 获取语言列表
const response = await fetch('/api/common/language/list');
const languages = response.data;

// 渲染选择器
languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.name;
    languageSelect.appendChild(option);
});
```

### 2. 国际化配置

```javascript
// 根据语言编码加载对应的语言包
const loadLanguagePack = (languageCode) => {
    return import(`./i18n/${languageCode}.js`);
};
```

### 3. 用户偏好设置

```javascript
// 保存用户选择的语言
const saveUserLanguage = (userId, languageCode) => {
    // 验证语言编码是否有效
    const validLanguages = await getLanguageList();
    const isValid = validLanguages.some(lang => lang.code === languageCode);
    
    if (isValid) {
        // 保存用户偏好
        await updateUserPreference(userId, { language: languageCode });
    }
};
```

## 扩展功能

### 可能的扩展方向

1. **语言管理**: 添加语言的增删改功能
2. **区域设置**: 支持更细粒度的地区设置
3. **翻译管理**: 集成翻译键值对管理
4. **语言检测**: 自动检测用户首选语言
5. **缓存优化**: 添加Redis缓存提升性能

### 数据扩展

可以扩展language表添加更多字段：

```sql
ALTER TABLE language ADD COLUMN region VARCHAR(10) COMMENT '地区代码';
ALTER TABLE language ADD COLUMN direction ENUM('ltr', 'rtl') DEFAULT 'ltr' COMMENT '文字方向';
ALTER TABLE language ADD COLUMN enabled TINYINT(1) DEFAULT 1 COMMENT '是否启用';
ALTER TABLE language ADD COLUMN sort_order INT DEFAULT 0 COMMENT '排序顺序';
```

## 注意事项

1. **语言编码规范**: 使用标准的语言-地区编码格式（如 zh-CN, en-US）
2. **字符编码**: 确保数据库和接口都使用UTF-8编码
3. **缓存策略**: 语言数据变化不频繁，适合缓存
4. **向后兼容**: 新增语言时要考虑现有系统的兼容性

## 相关文档

- **API文档**: 访问 `/api/swagger-ui/` 查看完整API文档
- **数据库设计**: 参考 `sql/create_language_table.sql`
- **测试用例**: 参考 `test/languageTest.js` 和 `test/languageApiTest.js`

---

**总结**: Language模块提供了简洁高效的语言管理功能，为系统的国际化提供了基础支持。模块设计简单、性能良好、易于扩展。
