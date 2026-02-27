FROM node:24.13.1 AS builder

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

# Budowa aplikacji
RUN yarn build

FROM node:24.13.1-alpine AS runtime

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package.json yarn.lock ./

RUN yarn --production=true && rm -rf /usr/local/share/.cache

COPY --from=builder /usr/src/app/dist ./dist

USER node

CMD ["node", "dist/main"]
