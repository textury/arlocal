import { readFileSync } from 'fs';
import { join } from 'path';
import { ApolloServer, Config, gql } from 'apollo-server-koa';
import { resolvers } from './resolvers';
import { BaseContext, DefaultContext } from 'koa';

const typeDefs = gql(readFileSync(join(__dirname, 'types.graphql'), 'utf8'));

export function graphServer(opts: Config = {}, ctx: BaseContext & DefaultContext) {
  return new ApolloServer({
    typeDefs,
    resolvers,
    debug: false,
    context: ({ req }) => {
      return {
        req,
        ...ctx,
      };
    },
    ...opts,
  });
}
