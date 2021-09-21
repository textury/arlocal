import { ChunkDB } from '../db/chunks';
import { Chunk } from 'faces/chunk';
import Router from 'koa-router';

let chunkDB: ChunkDB;

export async function postChunkRoute(ctx: Router.RouterContext) {
  try {
    if (!chunkDB) {
      chunkDB = new ChunkDB(ctx.connection);
    }

    const chunk = ctx.request.body as unknown as Chunk;

    await chunkDB.create(chunk);

    ctx.body = {};
  } catch (error) {
    console.error({ error });
  }
}

export async function getChunkOffsetRoute(ctx: Router.RouterContext) {
  try {
    if (!chunkDB) {
      chunkDB = new ChunkDB(ctx.connection);
    }
    const offset = +ctx.params.offset;

    ctx.body = await chunkDB.getByOffset(offset);
  } catch (error) {
    console.error({ error });
  }
}
