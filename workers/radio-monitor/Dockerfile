FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
RUN npm install tsx@4.20.5

COPY tsconfig.json ./
COPY src ./src
COPY workers ./workers

ENV NODE_ENV=production

CMD ["npx", "tsx", "workers/radio-monitor/index.ts"]
