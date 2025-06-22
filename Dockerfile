FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

RUN mkdir -p dist/doc && cp src/doc/*.json dist/doc/ 2>/dev/null || echo "No JSON files to copy"

EXPOSE 3000

CMD ["node", "dist/index.js"]
