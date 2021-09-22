import { ChunkDB } from '../db/chunks';
import { Chunk } from 'faces/chunk';
import Router from 'koa-router';
import { parseB64UrlOrThrow } from '../utils/encoding';
import { validatePath } from 'arweave/node/lib/merkle';

let chunkDB: ChunkDB;
let oldDbPath: string;

export async function postChunkRoute(ctx: Router.RouterContext) {
  try {
    if (oldDbPath !== ctx.dbPath || !chunkDB) {
      chunkDB = new ChunkDB(ctx.connection);
      oldDbPath = ctx.dbPath;
    }

    const chunk = ctx.request.body as unknown as Chunk;

    const dataPath = parseB64UrlOrThrow(chunk.data_path, 'data_path');

    const root = parseB64UrlOrThrow(chunk.data_root, 'data_root');

    const isValid = await validateChunk(root, +chunk.offset, chunk.data_size, dataPath);

    if (!isValid) {
      ctx.status = 422;
      ctx.body = { status: 422, error: 'Chunk validation failed' };
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

    ctx.body = await chunkDB.getByOffset(offset);
  } catch (error) {
    console.error({ error });
  }
}

const validateChunk = async (root: Buffer, offset: number, size: number, proof: Buffer) => {
  try {
    return await validatePath(root, offset, 0, size, proof);
  } catch (error) {
    console.warn(error);
    return false;
  }
};
