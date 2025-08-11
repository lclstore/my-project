const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// 公共路径前缀（从环境变量读取）
const API_PREFIX = process.env.API_PREFIX || '/api';

// Swagger配置选项
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '全栈应用后端API',
      version: '1.0.0',
      description: '一个完整的Node.js后端API，包含用户认证、文件管理、数据操作等功能',
      // contact: {
      //   name: 'API Support',
      //   email: 'support@example.com'
      // },
      // license: {
      //   name: 'MIT',
      //   url: 'https://opensource.org/licenses/MIT'
      // }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8080}${API_PREFIX}`,
        description: '开发环境服务器'
      },
      {
        url: `https://api.example.com${API_PREFIX}`,
        description: '生产环境服务器'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT认证令牌'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            id: {
              type: 'integer',
              description: '用户ID',
              example: 103
            },
            email: {
              type: 'string',
              format: 'email',
              description: '邮箱地址',
              example: 'liuchenglong@laien.io'
            },
            password: {
              type: 'string',
              description: '密码（MD5加密）',
              example: 'e10adc3949ba59abbe56e057f20f883e'
            },
            name: {
              type: 'string',
              description: '用户名称',
              example: 'lcl012310y'
            },
            avatar: {
              type: 'string',
              description: '用户头像URL',
              example: 'https://amber.7mfitness.com/user/image/22049bdd-e6ee-49a3-a16e-0b4e387b6304.png?name=dDaMaFRMAnvN3kc3'
            },
            status: {
              type: 'string',
              description: '用户状态',
              example: 'ENABLED',
              enum: ['ENABLED', 'DISABLED']
            },
            type: {
              type: 'string',
              description: '用户类型',
              example: 'ADMIN',
              enum: ['ADMIN', 'USER']
            },
            createTime: {
              type: 'string',
              format: 'date-time',
              description: '创建时间',
              example: '2025-06-05 09:27:06'
            },
            createUser: {
              type: 'string',
              description: '创建者',
              example: 'admin'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: '邮箱地址',
              example: 'liuchenglong@laien.io'
            },
            password: {
              type: 'string',
              description: '密码（前端MD5加密后）',
              example: 'e10adc3949ba59abbe56e057f20f883e'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: '用户名',
              example: 'newuser'
            },
            email: {
              type: 'string',
              format: 'email',
              description: '邮箱地址',
              example: 'newuser@example.com'
            },
            password: {
              type: 'string',
              description: '密码',
              example: '123456'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '操作是否成功'
            },
            message: {
              type: 'string',
              description: '响应消息'
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'JWT令牌'
                },
                user: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        },
        FileInfo: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '文件ID'
            },
            original_name: {
              type: 'string',
              description: '原始文件名'
            },
            file_name: {
              type: 'string',
              description: '存储文件名'
            },
            file_path: {
              type: 'string',
              description: '文件路径'
            },
            file_size: {
              type: 'integer',
              description: '文件大小（字节）'
            },
            mime_type: {
              type: 'string',
              description: '文件MIME类型'
            },
            upload_time: {
              type: 'string',
              format: 'date-time',
              description: '上传时间'
            },
            download_count: {
              type: 'integer',
              description: '下载次数',
              default: 0
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '操作是否成功'
            },
            message: {
              type: 'string',
              description: '响应消息'
            },
            data: {
              type: 'object',
              description: '响应数据'
            }
          }
        },
        PaginationResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '操作是否成功'
            },
            data: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: '数据列表'
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  description: '当前页码'
                },
                pageSize: {
                  type: 'integer',
                  description: '每页数量'
                },
                total: {
                  type: 'integer',
                  description: '总记录数'
                },
                totalPages: {
                  type: 'integer',
                  description: '总页数'
                },
                hasNext: {
                  type: 'boolean',
                  description: '是否有下一页'
                },
                hasPrev: {
                  type: 'boolean',
                  description: '是否有上一页'
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: '错误消息'
            },
            error: {
              type: 'string',
              description: '详细错误信息'
            }
          }
        },
        EnumValue: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              description: '枚举值代码',
              example: 1
            },
            name: {
              type: 'string',
              description: '枚举值名称',
              example: 'Female'
            },
            displayName: {
              type: 'string',
              description: '枚举值显示名称',
              example: 'Female'
            },
            enumName: {
              type: 'string',
              description: '枚举值常量名',
              example: 'FEMALE'
            }
          }
        },
        EnumGroup: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: '枚举组名称',
              example: 'BizExerciseGenderEnums'
            },
            displayName: {
              type: 'string',
              description: '枚举组显示名称',
              example: 'BizExerciseGenderEnums'
            },
            datas: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/EnumValue'
              },
              description: '枚举值列表'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'User',
        description: '用户认证相关接口'
      },
      {
        name: 'Files',
        description: '文件管理相关接口'
      },
      {
        name: 'Data',
        description: '通用数据操作接口'
      },
      {
        name: 'Enums',
        description: '枚举管理相关接口'
      },
      {
        name: 'System',
        description: '系统相关接口'
      }
    ]
  },
  apis: [
    './routes/*.js', // 扫描路由文件中的注释
    './server.js'    // 扫描主文件
  ]
};

// 生成Swagger规范
const specs = swaggerJsdoc(options);

// Swagger UI配置
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'none', // 默认折叠所有接口
    filter: true,         // 启用搜索过滤
    showRequestHeaders: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .scheme-container { margin: 20px 0 }
  `,
  customSiteTitle: '全栈应用API文档'
};

module.exports = {
  specs,
  swaggerUi,
  swaggerUiOptions
};
