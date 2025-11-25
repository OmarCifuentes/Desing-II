FROM node:20-alpine

LABEL maintainer="log-service"
LABEL description="Centralized Logging Service"

WORKDIR /app

COPY services/log-service/package*.json ./
RUN npm install --only=production && npm cache clean --force

COPY shared ./shared
COPY services/log-service/src ./src
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001 && \
  chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8082/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/index.js"]
