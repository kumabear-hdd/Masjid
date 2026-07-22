# Node + native build tools for better-sqlite3
FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Runtime data (override with volume / DATA_DIR in production)
RUN mkdir -p /app/data /app/server/uploads \
  && chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=3000

USER node
EXPOSE 3000

CMD ["npm", "start"]
