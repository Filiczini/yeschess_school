FROM node:20-alpine
WORKDIR /app

COPY shared/ ./shared/
COPY backend/package*.json ./backend/

WORKDIR /app/backend
RUN npm install

COPY backend/ .
RUN npx tsc

EXPOSE 3000
CMD ["node", "dist/index.js"]
