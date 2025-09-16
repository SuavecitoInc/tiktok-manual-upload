# Build React client first
FROM node:22-alpine AS client-build
WORKDIR /app
COPY ../client/package*.json ./
RUN npm install
COPY ../client ./
RUN npm run build

# Build server
FROM node:22-alpine AS server-build
WORKDIR /app
COPY ../server/package*.json ./
RUN npm install
COPY ../server .
RUN npm run build

# Final image
FROM node:22-alpine
WORKDIR /app

# Copy server dist
COPY --from=server-build /app/dist ./dist
COPY --from=server-build /app/package*.json ./

# Copy backend .env
COPY ../server/.env ./

# Copy React build
COPY --from=client-build /app/dist ./client/dist

RUN npm install --production

EXPOSE 3001
CMD ["node", "dist/index.js"]
