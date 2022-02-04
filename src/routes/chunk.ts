import { ChunkDB } from '../db/chunks';
import { Chunk } from 'faces/chunk';
import Router from 'koa-router';

let chunkDB: ChunkDB;
let oldDbPath: string;

export async function postChunkRoute(ctx: Router.RouterContext) {
  try {
    if (oldDbPath !== ctx.dbPath || !chunkDB) {
      chunkDB = new ChunkDB(ctx.connection);
      oldDbPath = ctx.dbPath;
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

    let chunk = await chunkDB.getByOffset(offset);
    if (!chunk) {
      chunk = await chunkDB.getLowerOffset(offset);
    }
    ctx.body = chunk;
  } catch (error) {
    console.error({ error });
  }
}
