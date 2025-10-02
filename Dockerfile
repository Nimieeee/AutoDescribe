# Multi-stage build for AutoDescribe Backend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend-clean/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend-clean/ .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY backend-clean/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/structured_products.csv ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S autodescribe -u 1001

# Change ownership of the app directory
RUN chown -R autodescribe:nodejs /app
USER autodescribe

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]