# Base de Conhecimento (Next.js). Usada pelo docker-compose.yml da raiz do repositório.
# Os rewrites /auth/* e /content/* são fixados no build: as variáveis do AuthService entram
# como argumentos de build e também ficam no ambiente de execução (o servidor as lê de novo).

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

FROM node:22-slim AS build
WORKDIR /app
ARG AUTH_INTERNAL_URL
ARG AUTH_ISSUER
ARG AUTH_AUDIENCE
ARG AUTH_ACCESS_COOKIE_NAME
ENV AUTH_INTERNAL_URL=$AUTH_INTERNAL_URL \
    AUTH_ISSUER=$AUTH_ISSUER \
    AUTH_AUDIENCE=$AUTH_AUDIENCE \
    AUTH_ACCESS_COOKIE_NAME=$AUTH_ACCESS_COOKIE_NAME \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
# Os artigos (src/content) são lidos do disco em tempo de execução: vai a árvore inteira.
COPY --from=build --chown=node:node /app ./
# Usuário sem privilégios: o processo não roda como root.
USER node
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
