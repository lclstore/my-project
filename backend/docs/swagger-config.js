/**
 * Swagger API 文档配置
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Exercise Management API',
      version: '1.0.0',
      description: `
        动作资源管理系统 API 文档
        
        ## 功能特性
        
        ### 🎯 核心模块
        - **Exercise 动作资源管理**: 完整的动作资源 CRUD 操作
        - **Sound 音频资源管理**: 音频资源管理功能
        - **用户管理**: 用户认证和权限管理
        - **文件管理**: 文件上传和管理
        
        ### 🌟 特色功能
        - **草稿状态支持**: 支持保存不完整的草稿数据
        - **智能搜索**: ID精确匹配 + 名称模糊搜索
        - **多条件筛选**: 支持多维度条件筛选
        - **字段自动转换**: camelCase ↔ snake_case 自动转换
        - **名称唯一性验证**: 防止重复名称
        
        ### 📝 使用说明
        - 所有接口都需要认证（除了登录接口）
        - 请求和响应数据使用 JSON 格式
        - 时间格式使用 ISO 8601 标准
        - 分页查询支持自定义排序和筛选
        
        ### 🔐 认证方式
        使用 Bearer Token 进行认证，在请求头中添加：
        \`Authorization: Bearer <your-token>\`
      `,
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
        url: 'http://localhost:3000',
        description: '开发环境'
      },
      {
        url: 'https://api.example.com',
        description: '生产环境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Token 认证'
        }
      },
      parameters: {
        PageIndex: {
          name: 'pageIndex',
          in: 'query',
          description: '页码（从1开始）',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          example: 1
        },
        PageSize: {
          name: 'pageSize',
          in: 'query',
          description: '每页数量（最大100）',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          },
          example: 10
        },
        OrderBy: {
          name: 'orderBy',
          in: 'query',
          description: '排序字段',
          required: false,
          schema: {
            type: 'string',
            default: 'id'
          },
          example: 'createTime'
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
          },
          example: 'DESC'
        },
        Keywords: {
          name: 'keywords',
          in: 'query',
          description: '关键词搜索（支持ID精确匹配和名称模糊搜索）',
          required: false,
          schema: {
            type: 'string'
          },
          example: '俯卧撑'
        }
      },
      responses: {
        BadRequest: {
          description: '请求参数错误',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  errCode: {
                    type: 'string',
                    example: 'INVALID_PARAMETERS'
                  },
                  errMessage: {
                    type: 'string',
                    example: '参数验证失败'
                  },
                  data: {
                    type: 'null',
                    example: null
                  }
                }
              }
            }
          }
        },
        Unauthorized: {
          description: '未授权访问',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  errCode: {
                    type: 'string',
                    example: 'UNAUTHORIZED'
                  },
                  errMessage: {
                    type: 'string',
                    example: '未授权访问'
                  },
                  data: {
                    type: 'null',
                    example: null
                  }
                }
              }
            }
          }
        },
        NotFound: {
          description: '资源不存在',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  errCode: {
                    type: 'string',
                    example: 'RECORD_NOT_FOUND'
                  },
                  errMessage: {
                    type: 'string',
                    example: '记录不存在'
                  },
                  data: {
                    type: 'null',
                    example: null
                  }
                }
              }
            }
          }
        },
        InternalError: {
          description: '服务器内部错误',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  errCode: {
                    type: 'string',
                    example: 'INTERNAL_ERROR'
                  },
                  errMessage: {
                    type: 'string',
                    example: '服务器内部错误'
                  },
                  data: {
                    type: 'null',
                    example: null
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Exercise',
        description: '动作资源的增删改查操作，支持草稿状态和智能搜索'
      },
      {
        name: 'Sound - 音频资源管理',
        description: '音频资源的管理功能'
      },
      {
        name: 'User - 用户管理',
        description: '用户认证和权限管理'
      },
      {
        name: 'File - 文件管理',
        description: '文件上传和管理功能'
      },
      {
        name: 'Enum - 枚举管理',
        description: '系统枚举值管理'
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './docs/*.md'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerSpec: specs,
  swaggerOptions: {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      requestSnippetsEnabled: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2
    }
  }
};
