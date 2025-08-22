/**
 * Swagger配置
 * API文档生成配置
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./index');

// Swagger配置选项
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Backend API Documentation',
      version: config.app.version,
      description: '企业级后台管理系统API文档',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.app.port}${config.api.prefix}`,
        description: `${config.app.env} server`
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Token认证'
        },
        tokenAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'token',
          description: 'Token认证'
        }
      },
      schemas: {
        // 通用响应格式
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '请求是否成功'
            },
            message: {
              type: 'string',
              description: '响应消息'
            },
            errCode: {
              type: 'string',
              nullable: true,
              description: '错误码'
            },
            errMessage: {
              type: 'string',
              nullable: true,
              description: '错误消息'
            },
            data: {
              description: '响应数据'
            }
          }
        },

        // 分页响应格式
        PaginatedResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponse' },
            {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {}
                },
                totalCount: {
                  type: 'integer',
                  description: '总数量'
                },
                pageIndex: {
                  type: 'integer',
                  description: '当前页码'
                },
                pageSize: {
                  type: 'integer',
                  description: '每页大小'
                },
                totalPages: {
                  type: 'integer',
                  description: '总页数'
                },
                empty: {
                  type: 'boolean',
                  description: '是否为空'
                },
                notEmpty: {
                  type: 'boolean',
                  description: '是否不为空'
                }
              }
            }
          ]
        },

        // 错误响应
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            errCode: {
              type: 'string',
              description: '错误码'
            },
            errMessage: {
              type: 'string',
              description: '错误消息'
            },
            message: {
              type: 'string',
              description: '错误消息'
            },
            data: {
              nullable: true,
              example: null
            }
          }
        },

        // 用户模型
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '用户ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '邮箱'
            },
            name: {
              type: 'string',
              description: '用户名'
            },
            avatar: {
              type: 'string',
              description: '头像URL'
            },
            status: {
              type: 'integer',
              description: '状态 0-禁用 1-启用'
            },
            type: {
              type: 'string',
              description: '用户类型'
            },
            createTime: {
              type: 'string',
              format: 'date-time',
              description: '创建时间'
            },
            updateTime: {
              type: 'string',
              format: 'date-time',
              description: '更新时间'
            }
          }
        },

        // 分类模型
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '分类ID'
            },
            name: {
              type: 'string',
              description: '分类名称'
            },
            description: {
              type: 'string',
              description: '分类描述'
            },
            parentId: {
              type: 'integer',
              nullable: true,
              description: '父级分类ID'
            },
            sortOrder: {
              type: 'integer',
              description: '排序'
            },
            status: {
              type: 'integer',
              description: '状态'
            },
            createTime: {
              type: 'string',
              format: 'date-time',
              description: '创建时间'
            },
            updateTime: {
              type: 'string',
              format: 'date-time',
              description: '更新时间'
            }
          }
        }
      },

      parameters: {
        // 分页参数
        PageIndex: {
          name: 'pageIndex',
          in: 'query',
          description: '页码',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        PageSize: {
          name: 'pageSize',
          in: 'query',
          description: '每页大小',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          }
        },

        // 排序参数
        OrderBy: {
          name: 'orderBy',
          in: 'query',
          description: '排序字段',
          required: false,
          schema: {
            type: 'string',
            default: 'id'
          }
        },
        OrderDirection: {
          name: 'orderDirection',
          in: 'query',
          description: '排序方向',
          required: false,
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC'
          }
        },

        // 搜索参数
        Keywords: {
          name: 'keywords',
          in: 'query',
          description: '搜索关键词',
          required: false,
          schema: {
            type: 'string'
          }
        },

        // 状态参数
        Status: {
          name: 'status',
          in: 'query',
          description: '状态筛选',
          required: false,
          schema: {
            type: 'integer',
            enum: [0, 1]
          }
        },

        // ID路径参数
        IdPath: {
          name: 'id',
          in: 'path',
          description: '记录ID',
          required: true,
          schema: {
            type: 'integer'
          }
        }
      }
    },

    // 全局安全配置
    security: [
      {
        bearerAuth: []
      },
      {
        tokenAuth: []
      }
    ],

    // 标签分组
    tags: [
      {
        name: 'Authentication',
        description: '认证相关接口'
      },
      {
        name: 'User',
        description: '用户管理接口'
      },
      {
        name: 'Category',
        description: '分类管理接口'
      },
      {
        name: 'Exercise',
        description: '练习管理接口'
      },
      {
        name: 'Sound',
        description: '音频管理接口'
      },
      {
        name: 'Workout',
        description: '训练计划接口'
      },
      {
        name: 'Program',
        description: '程序管理接口'
      },
      {
        name: 'Template',
        description: '模板管理接口'
      },
      {
        name: 'Resource',
        description: '资源管理接口'
      },
      {
        name: 'System',
        description: '系统接口'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

// 生成Swagger规范
const specs = swaggerJsdoc(options);

// Swagger UI配置
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai'
    }
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .scheme-container { 
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); 
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `,
  customSiteTitle: 'Backend API Documentation',
  customfavIcon: '/favicon.ico'
};

module.exports = {
  specs,
  swaggerUi,
  swaggerUiOptions,

  // 获取API文档配置
  getApiDocConfig() {
    return {
      title: 'Backend API Documentation',
      version: config.app.version,
      description: '企业级后台管理系统API文档',
      baseUrl: `${config.app.url}${config.api.prefix}`
    };
  },

  // 添加自定义端点文档
  addEndpointDoc(path, method, definition) {
    if (!specs.paths) {
      specs.paths = {};
    }
    if (!specs.paths[path]) {
      specs.paths[path] = {};
    }
    specs.paths[path][method.toLowerCase()] = definition;
  }
};