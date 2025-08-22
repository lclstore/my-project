# 多阶段构建，优化镜像大小
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci && npm cache clean --force

# 复制源代码
COPY . .

# 运行代码检查和构建（如果需要）
# RUN npm run lint && npm run test

# 生产阶段
FROM node:18-alpine AS production

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 安装dumb-init用于信号处理
RUN apk add --no-cache dumb-init

# 创建应用目录
WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# 复制package文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/*

# 复制应用代码
COPY --chown=nodejs:nodejs --from=builder /app/src ./src
COPY --chown=nodejs:nodejs --from=builder /app/healthcheck.js ./
COPY --chown=nodejs:nodejs --from=builder /app/.env.example ./

# 创建必要的目录并设置权限
RUN mkdir -p storage/logs storage/uploads && \
    chown -R nodejs:nodejs storage

# 设置文件权限
RUN chmod 755 src && \
    find src -type f -exec chmod 644 {} \;

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node healthcheck.js || exit 1

# 使用dumb-init作为入口点
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["node", "src/server.js"]
