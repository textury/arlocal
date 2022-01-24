FROM node:16 as build
WORKDIR /app
COPY . .
RUN yarn

FROM node:16-alpine 
RUN apk add dumb-init
USER node
WORKDIR /arlocal

COPY --chown=node:node --from=build /app/bin/ ./bin
COPY --chown=node:node --from=build /app/node_modules/ ./node_modules
COPY --chown=node:node --from=build /app/package.json ./package.json

EXPOSE 1984
CMD [ "dumb-init", "node", "bin/index.js" ]