FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json tsconfig.json tsconfig.frontend.json ./
RUN npm install

COPY src ./src
COPY test ./test
COPY frontend ./frontend
COPY public ./public
COPY data ./data
COPY *.md ./

RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "node dist/src/scripts/seed.js && node dist/src/server.js"]
