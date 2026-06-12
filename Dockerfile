# Hoorshid QR Menu — single-container image (Express serves API + built frontend).
# Debian-slim base so sharp/better-sqlite3 use prebuilt binaries (no compiler needed).
FROM node:22-slim

WORKDIR /app

# install dependencies first (cached layer as long as package files don't change)
COPY package*.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm install --include=dev --no-audit --no-fund

# copy the source and build the frontend, then drop dev dependencies
COPY . .
RUN npm run build && npm prune --omit=dev && npm cache clean --force

ENV NODE_ENV=production
EXPOSE 4000

# data (SQLite) and uploads (photos) must live on volumes — see docker-compose.yml
VOLUME ["/app/data", "/app/uploads"]

CMD ["node", "server/index.js"]
