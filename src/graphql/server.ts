import { readFileSync } from 'fs';
import { join } from 'path';
import { ApolloServer, Config, gql } from 'apollo-server-koa';
import { resolvers } from './resolvers';
import { Knex } from 'knex';

const typeDefs = gql(readFileSync(join(__dirname, 'types.graphql'), 'utf8'));

export function graphServer(opts: Config = {}, connection: Knex) {
  return new ApolloServer({
    typeDefs,
    resolvers,
    debug: false,
    context: ({ req }) => {
      return {
        req,
        connection,
      };
    },
    ...opts,
  });
}
