# ============================================================
# FloodGuard 洪水安防地理智能系统 - Docker 镜像
# 用于 OpenDeploy 边缘部署
# ============================================================

# ---- 阶段1: 构建前端 ----
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# ---- 阶段2: 构建后端 ----
FROM node:20-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY api/ ./api/
COPY tsconfig.json ./

# ---- 阶段3: 生产镜像（轻量化，适合边缘设备） ----
FROM node:20-alpine AS production
WORKDIR /app

# 安装仅运行时依赖
COPY package*.json ./
RUN npm ci --only=production --silent

# 复制构建产物
COPY --from=frontend-builder /app/dist ./dist
COPY --from=backend-builder /app/api ./api
COPY --from=backend-builder /app/tsconfig.json ./

# 环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV MONID_API_URL=https://api.monid.com/v1
ENV OPENDEPLOY_API_URL=https://api.opendeploy.io/v1

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

EXPOSE 3001

# 启动命令
CMD ["npx", "tsx", "api/server.ts"]
