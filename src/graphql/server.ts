import { readFileSync } from 'fs';
import { ApolloServer, Config, gql } from 'apollo-server-koa';
import { connection } from '../db/connection';
import { resolvers } from './resolvers';

const typeDefs = gql(readFileSync(`${process.cwd()}/types.graphql`, 'utf8'));

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
