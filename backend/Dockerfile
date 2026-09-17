# NestJS Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Dependency installation
COPY package*.json ./
RUN npm ci

# Source code copy & build
COPY . .
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

# Copy built dist & contracts/scripts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/contracts ./contracts
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

CMD ["node", "dist/main.js"]
