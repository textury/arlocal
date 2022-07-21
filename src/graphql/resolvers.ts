import moment from 'moment';
import { QueryTransactionsArgs, QueryBlockArgs, QueryBlocksArgs } from './types';
import { ISO8601DateTimeString, utf8DecodeTag } from '../utils/encoding';
import { TransactionHeader } from '../faces/arweave';
import { QueryParams, generateQuery, generateBlockQuery } from './query';
import { winstonToAr } from '../utils/ar';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const fieldMap = {
  id: 'transactions.id',
  anchor: 'transactions.last_tx',
  recipient: 'transactions.target',
  tags: 'transactions.tags',
  fee: 'transactions.reward',
  quantity: 'transactions.quantity',
  data_size: 'transactions.data_size',
  data_type: 'transactions.content_type',
  parent: 'transactions.parent',
  owner: 'transactions.owner',
  owner_address: 'transactions.owner_address',
  signature: 'transactions.signature',
  block_id: 'blocks.id',
  block_timestamp: 'blocks.mined_at',
  block_height: 'blocks.height',
  block_previous: 'blocks.previous_block',
};

const blockFieldMap = {
  id: 'blocks.id',
  timestamp: 'blocks.mined_at',
  height: 'blocks.height',
  previous: 'blocks.previous_block',
  extended: 'blocks.extended',
};

export const resolvers = {
  Query: {
    transaction: async (_, queryParams, { connection }) => {
      const params: QueryParams = {
        id: queryParams.id,
        blocks: true,
        select: fieldMap,
      };

      const result = await generateQuery(params, connection);

      return result[0] as TransactionHeader;
    },
    transactions: async (_, queryParams: QueryTransactionsArgs, { connection }) => {
      const { timestamp, offset } = parseCursor(queryParams.after || newCursor());
      const pageSize = Math.min(queryParams.first || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

      const params: QueryParams = {
        limit: pageSize + 1,
        offset,
        ids: queryParams.ids || undefined,
        to: queryParams.recipients || undefined,
        from: queryParams.owners || undefined,
        tags: queryParams.tags || undefined,
        blocks: true,
        since: timestamp,
        select: fieldMap,
        minHeight: queryParams.block?.min || undefined,
        maxHeight: queryParams.block?.max || undefined,
        sortOrder: queryParams.sort || undefined,
      };

      const results = (await generateQuery(params, connection)) as TransactionHeader[];
      const hasNextPage = results.length > pageSize;

      return {
        pageInfo: {
          hasNextPage,
        },
        edges: async () => {
          return results.slice(0, pageSize).map((result: any, index) => {
            return {
              cursor: encodeCursor({ timestamp, offset: offset + index + 1 }),
              node: result,
            };
          });
        },
      };
    },
    block: async (_, queryParams: QueryBlockArgs, { connection }) => {
      if (queryParams.id) {
        return (
          await generateBlockQuery(
            {
              select: blockFieldMap,
              id: queryParams.id,
            },
            connection,
          )
        )[0];
      } else {
        return null;
      }
    },
    blocks: async (_, queryParams: QueryBlocksArgs, { connection, network }) => {
      const { timestamp, offset } = parseCursor(queryParams.after || newCursor());
      const pageSize = Math.min(queryParams.first || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

      let ids: string[] = [];
      let minHeight = 0;
      let maxHeight = network.height || MAX_PAGE_SIZE;

      if (queryParams.ids) {
        ids = queryParams.ids;
      }

      if (queryParams.height && queryParams.height.min) {
        minHeight = queryParams.height.min;
      }

      if (queryParams.height && queryParams.height.max) {
        maxHeight = queryParams.height.max;
      }

      const query = generateBlockQuery(
        {
          ids,
          select: blockFieldMap,
          minHeight,
          maxHeight,
          sortOrder: queryParams.sort || 'HEIGHT_ASC',
          limit: pageSize + 1,
          offset,
          before: timestamp,
        },
        connection,
      );

      const results = await query;
      // @ts-ignore
      const hasNextPage = results.length > pageSize;

      return {
        pageInfo: {
          hasNextPage,
        },
        edges: async () => {
          // @ts-ignore
          return results.slice(0, pageSize).map((result: any, index: number) => {
            return {
              cursor: encodeCursor({ timestamp, offset: offset + index + 1 }),
              node: result,
            };
          });
        },
      };
    },
  },
  Transaction: {
    tags: (parent) => {
      if (typeof parent.tags === 'string') parent.tags = JSON.parse(parent.tags);
      return parent.tags.map(utf8DecodeTag);
    },
    recipient: (parent) => {
      return parent.recipient.trim();
    },
    data: (parent) => {
      return {
        size: parent.data_size || 0,
        type: parent.data_type,
      };
    },
    quantity: (parent) => {
      return {
        ar: winstonToAr(parent.quantity || 0),
        winston: parent.quantity || 0,
      };
    },
    fee: (parent) => {
      return {
        ar: winstonToAr(parent.fee || 0),
        winston: parent.fee || 0,
      };
    },
    block: (parent) => {
      if (parent.block_id) {
        return {
          id: parent.block_id,
          previous: parent.block_previous,
          timestamp: parent.block_timestamp,
          height: parent.block_height,
        };
      }
    },
    owner: (parent) => {
      return {
        address: parent.owner_address,
        key: parent.owner,
      };
    },
    parent: (parent) => {
      if (parent.parent) {
        return {
          id: parent.parent,
        };
      }
    },
  },
  Block: {
    /*
    reward: (parent) => {
      return {
        address: parent.extended.reward_addr,
        pool: parent.extended.reward_pool,
      };
    },
    size: (parent) => {
      return parent.extended?.block_size;
    },
    */
    timestamp: (parent) => {
      return moment(parent?.timestamp).unix();
    },
  },
};

export interface Cursor {
  timestamp: ISO8601DateTimeString;
  offset: number;
}

export const newCursor = (): string => encodeCursor({ timestamp: moment().toISOString(), offset: 0 });

export const encodeCursor = ({ timestamp, offset }: Cursor): string => {
  const str = JSON.stringify([timestamp, offset]);
  return Buffer.from(str).toString('base64');
};

export const parseCursor = (cursor: string): Cursor => {
  try {
    const [timestamp, offset] = JSON.parse(Buffer.from(cursor, 'base64').toString()) as [ISO8601DateTimeString, number];
    return { timestamp, offset };
  } catch (error) {
    throw new Error('invalid cursor');
  }
};
