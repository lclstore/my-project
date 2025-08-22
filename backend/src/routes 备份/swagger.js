/**
 * Swagger API 文档路由
 */

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec, swaggerOptions } = require('../docs/swagger-config');

const router = express.Router();

// Swagger JSON 端点
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger UI 文档页面
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, swaggerOptions));

module.exports = router;
