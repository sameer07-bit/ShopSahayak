# Multi-stage production Dockerfile for Gemini Handwriting AI Reader
FROM node:20-alpine AS base

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose server port
EXPOSE 3000

# Environment defaults
ENV PORT=3000
ENV NODE_ENV=production

# Start application server
CMD ["node", "server.js"]
