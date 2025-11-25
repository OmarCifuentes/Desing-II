FROM node:20-alpine

# Metadata
LABEL maintainer="auth-service"
LABEL description="Microsoft Entra ID Authentication Service"

# Create app directory
WORKDIR /app

# Install dependencies
COPY services/auth-service/package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy shared folder first
COPY shared ./shared

# Copy application code
COPY services/auth-service/src ./src
# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "src/index.js"]
