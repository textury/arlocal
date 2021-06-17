import { readFileSync } from 'fs';
import { join } from 'path';
import { ApolloServer, Config, gql } from 'apollo-server-koa';
import { connection } from '../db/connection';
import { resolvers } from './resolvers';

const typeDefs = gql(readFileSync(join(__dirname, 'types.graphql'), 'utf8'));

export function graphServer(opts: Config = {}) {
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
