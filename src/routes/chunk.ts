import { validatePath } from 'arweave/node/lib/merkle';
import { ChunkDB } from '../db/chunks';
import { Chunk } from 'faces/chunk';
import Router from 'koa-router';
import { pick } from 'lodash';
import { b64UrlToBuffer, fromB64Url, sha256 } from '../utils/encoding';
import { createWriteStream } from 'fs';

let chunkDB: ChunkDB;

export async function postChunkRoute(ctx: Router.RouterContext) {
  try {
    if (!chunkDB) {
      chunkDB = new ChunkDB(ctx.connection);
    }
    const chunk = ctx.request.body as unknown as Chunk;

    const chunkData = parseB64UrlOrThrow(chunk.chunk, 'chunk');

    const dataPath = parseB64UrlOrThrow(chunk.data_path, 'data_path');

    const root = parseB64UrlOrThrow(chunk.data_root, 'data_root');

    const isValid = await validateChunk(root, chunk.offset, chunk.data_size, dataPath);

    if (!isValid) {
      ctx.status = 422;
      ctx.body = { status: 422, error: 'Chunk validation failed' };
    }

    const queueItem = {
      size: chunkData.byteLength,
      header: pick(chunk, ['data_root', 'data_size', 'data_path', 'offset']),
    };

    await chunkDB.create(chunk);

    ctx.body = { queueItem };
  } catch (error) {
    console.error({ error });
  }
}

const parseB64UrlOrThrow = (b64urlString: string, fieldName: string) => {
  try {
    return fromB64Url(b64urlString);
  } catch (error) {
    throw new Error(`missing field: ${fieldName}`);
  }
};

const validateChunk = async (root: Buffer, offset: number, size: number, proof: Buffer) => {
  try {
    return (await validatePath(root, offset, 0, size, proof)) !== false;
  } catch (error) {
    console.warn(error);
    return false;
  }
};
