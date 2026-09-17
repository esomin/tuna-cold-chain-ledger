# Multi-stage Frontend Dockerfile (Vite React + Nginx)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Environment variable at build time
ARG VITE_API_URL=/api
ARG VITE_CONTRACT_ADDRESS=0xc4040d7Cdbc6923500A94427DB9c78156d70849A

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CONTRACT_ADDRESS=$VITE_CONTRACT_ADDRESS

RUN npm run build

# Nginx Production Serving Stage
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
