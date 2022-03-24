import { ChunkDB } from '../db/chunks';
import { Chunk } from 'faces/chunk';
import Router from 'koa-router';
import { b64UrlToBuffer } from '../utils/encoding';

let chunkDB: ChunkDB;
let oldDbPath: string;

export async function postChunkRoute(ctx: Router.RouterContext) {
  try {
    if (oldDbPath !== ctx.dbPath || !chunkDB) {
      chunkDB = new ChunkDB(ctx.connection);
      oldDbPath = ctx.dbPath;
    }

    const chunk = ctx.request.body as unknown as Chunk;
    const lastOffset = await chunkDB.getLastChunkOffset();
    if (!lastOffset) chunk.offset = b64UrlToBuffer(chunk.chunk).length;
    else {
      const lastChunk = await chunkDB.getByOffset(lastOffset);
      chunk.offset = lastOffset + b64UrlToBuffer(lastChunk.chunk).length;
    }

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

    const chunk = await chunkDB.getByOffset(offset);
    if (!chunk) {
      ctx.status = 204;
      return;
    }
    ctx.body = chunk;
    return;
  } catch (error) {
    console.error({ error });
  }
}
