# Stage 1: Build
FROM node:20-alpine3.20 AS builder

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

## Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build


# Stage 2: Production
FROM node:20-alpine3.20 AS runner

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder --chown=node:node /app/.next /app/.next
COPY --from=builder /app/public /app/public
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/prisma /app/prisma
COPY ./.env.prod /app/.env

RUN chown -R node:node /app
USER node

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

CMD ["npm", "run", "start"]