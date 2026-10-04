# Multi-stage production Dockerfile for Gemini Handwriting AI Reader
FROM node:20-alpine AS base

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev --no-audit --no-fund

# Copy application source code
COPY . .

# Expose server port
EXPOSE 5000

ENV NODE_ENV=production

# Start application server
CMD ["node", "server.js"]
