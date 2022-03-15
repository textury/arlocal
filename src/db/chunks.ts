import { Chunk } from 'faces/chunk';
import { Knex } from 'knex';
import { Utils } from '../utils/utils';

export class ChunkDB {
  private connection: Knex;

  constructor(connection: Knex) {
    this.connection = connection;
  }

  async create({ chunk, data_root, data_size, offset, data_path }: Chunk) {
    try {
      const id = Utils.randomID(64);

      await this.connection
        .insert({
          id: Utils.randomID(64),
          chunk,
          data_root,
          data_size,
          offset,
          data_path,
        })
        .into('chunks');

      return id;
    } catch (error) {
      console.error({ error });
    }
  }

  async getByRootAndSize(dataRoot: string, dataSize: number) {
    try {
      return (await this.connection('chunks').where({ data_root: dataRoot, data_size: dataSize }))[0];
    } catch (error) {
      console.error({ error });
    }
  }

  async getRoot(dataRoot: string) {
    try {
      return await this.connection('chunks').where({ data_root: dataRoot });
    } catch (error) {
      console.error({ error });
    }
  }

  async getByOffset(offset: number) {
    try {
      return (await this.connection('chunks').where({ offset }))[0];
    } catch (error) {
      console.error({ error });
    }
  }

  async getLowerOffset(offset: number) {
    try {
      return (await this.connection('chunks').where('offset', '<', offset).orderBy('offset', 'desc'))[0];
    } catch (error) {
      console.error({ error });
    }
  }

  async getLastChunkOffset(): Promise<number> {
    try {
      const chunk = (await this.connection('chunks').orderBy('offset', 'desc'))[0];
      if (!chunk || !chunk.offset) {
        return 0;
      }
      return chunk.offset;
    } catch (error) {
      console.log('I crashed');
      console.error({ error });
    }
  }
}
