FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
RUN npm install

COPY shared ./shared
COPY backend ./backend

WORKDIR /app/backend
RUN npm run build

FROM node:22-alpine

WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules

WORKDIR /app/backend
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
CMD ["npm", "start"]
