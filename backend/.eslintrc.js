module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // 基础代码风格
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],

    // 变量声明
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',

    // 函数
    'no-empty-function': 'error',
    'prefer-arrow-callback': 'error',

    // 对象和数组
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],

    // 比较和条件
    'eqeqeq': 'error',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

    // ES6+
    'prefer-template': 'error',
    'prefer-destructuring': ['error', {
      'array': false,
      'object': true
    }],

    // 代码质量
    'no-duplicate-imports': 'error',
    'no-unreachable': 'error',
    'consistent-return': 'error',

    // 安全相关
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // 最佳实践
    'curly': 'error',
    'dot-notation': 'error',
    'no-multi-spaces': 'error',
    'no-trailing-spaces': 'error',
    'comma-dangle': ['error', 'never'],
    'no-multiple-empty-lines': ['error', { 'max': 1 }],

    // Node.js 特定
    'no-process-exit': 'error',
    'handle-callback-err': 'error'
  },
  globals: {
    'process': 'readonly',
    'global': 'readonly',
    'Buffer': 'readonly',
    '__dirname': 'readonly',
    '__filename': 'readonly'
  }
};