FROM node:16-alpine as build

WORKDIR /app
COPY . .
RUN apk add git
RUN yarn

FROM node:16-alpine 
USER node
WORKDIR /arlocal

COPY --chown=node:node --from=build /app/bin/ ./bin
COPY --chown=node:node --from=build /app/node_modules/ ./node_modules

EXPOSE 1984
CMD [ "node", "bin/index.js" ]