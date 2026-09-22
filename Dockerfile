FROM oven/bun:1.2-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN bun install
COPY . .
RUN bun run build

FROM oven/bun:1.2-alpine AS runner
WORKDIR /app
COPY package.json ./
RUN bun install --production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/data ./data
COPY --from=builder /app/src ./src

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "run", "server/standalone.ts"]
