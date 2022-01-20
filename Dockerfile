FROM node:alpine as build-stage

WORKDIR /app

COPY ./ .

RUN yarn

FROM node:alpine 

WORKDIR /arlocal

COPY --from=build-stage /app/bin/ ./bin
COPY --from=build-stage /app/node_modules/ ./node_modules

CMD [ "node","bin/index.js" ]
