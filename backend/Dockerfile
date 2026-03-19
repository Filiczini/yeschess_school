FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ .
RUN node node_modules/typescript/bin/tsc

EXPOSE 3000
CMD ["node", "dist/index.js"]