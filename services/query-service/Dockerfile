FROM node:20-alpine

LABEL maintainer="query-service"
LABEL description="Query Service with RAG + LLM"

WORKDIR /app

COPY services/query-service/package*.json ./
RUN npm install --only=production && npm cache clean --force

COPY shared ./shared
COPY services/query-service/src ./src
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8081/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/index.js"]
