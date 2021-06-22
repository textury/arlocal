import { Knex, knex } from 'knex';
import { indices } from '../utils/order';
import { ISO8601DateTimeString } from '../utils/encoding';
import { TagFilter } from './types';

export type TxSortOrder = 'HEIGHT_ASC' | 'HEIGHT_DESC';

export const orderByClauses = {
  HEIGHT_ASC: 'transactions.height ASC',
  HEIGHT_DESC: 'transactions.height DESC',
};

export interface QueryParams {
  to?: string[];
  from?: string[];
  id?: string;
  ids?: string[];
  tags?: TagFilter[];
  limit?: number;
  offset?: number;
  select?: any;
  blocks?: boolean;
  since?: ISO8601DateTimeString;
  sortOrder?: TxSortOrder;
  status?: 'any' | 'confirmed' | 'pending';
  pendingMinutes?: number;
  minHeight?: number;
  maxHeight?: number;
}

export async function generateQuery(params: QueryParams, connection: Knex): Promise<knex.QueryBuilder> {
  const { to, from, tags, id, ids, status = 'confirmed', select } = params;
  const { limit = 10, blocks = false, sortOrder = 'HEIGHT_DESC' } = params;
  const { offset = 0, minHeight = -1, maxHeight = -1 } = params;

  const query = connection
    .queryBuilder()
    .select(select || { id: 'transactions.id', height: 'transactions.height', tags: 'transactions.tags' })
    .from('transactions');

  if (id) {
    query.where('transactions.id', id);
  }

  if (ids) {
    query.whereIn('transactions.id', ids);
  }

  if (blocks) {
    query.leftJoin('blocks', 'transactions.height', 'blocks.height');
  }

  if (status === 'confirmed') {
    query.whereNotNull('transactions.height');
  }

  if (to) {
    query.whereIn('transactions.target', to);
  }

  if (from) {
    query.whereIn('transactions.owner_address', from);
  }

  if (tags) {
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      const tagAlias = `${i}_${i}`;
      let indexed = false;

      for (const index of indices) {
        if (tag.name === index) {
          indexed = true;

          if (tag.op === 'EQ') {
            query.whereIn(`transactions.${index}`, tag.values);
          }

          if (tag.op === 'NEQ') {
            query.whereNotIn(`transactions.${index}`, tag.values);
          }
        }
      }

      if (indexed === false) {
        query.join(`tags as ${tagAlias}`, (join) => {
          join.on('transactions.id', `${tagAlias}.tx_id`);

          join.andOnIn(`${tagAlias}.name`, [tag.name]);

          if (tag.op === 'EQ') {
            join.andOnIn(`${tagAlias}.value`, tag.values);
          }

          if (tag.op === 'NEQ') {
            join.andOnNotIn(`${tagAlias}.value`, tag.values);
          }
        });
      }
    }
  }

  if (minHeight >= 0) {
    query.where('transactions.height', '>=', minHeight);
  }

  if (maxHeight >= 0) {
    query.where('transactions.height', '<=', maxHeight);
  }

  query.limit(limit).offset(offset);

  if (Object.keys(orderByClauses).includes(sortOrder)) {
    query.orderByRaw(orderByClauses[sortOrder]);
  }

  return query;
}

export const blockOrderByClauses = {
  HEIGHT_ASC: 'blocks.height ASC NULLS LAST, id ASC',
  HEIGHT_DESC: 'blocks.height DESC NULLS FIRST, id ASC',
};

export type BlockSortOrder = 'HEIGHT_ASC' | 'HEIGHT_DESC';

export interface BlockQueryParams {
  id?: string;
  ids?: string[];
  limit?: number;
  offset?: number;
  select?: any;
  before?: ISO8601DateTimeString;
  sortOrder?: BlockSortOrder;
  minHeight?: number;
  maxHeight?: number;
}

export async function generateBlockQuery(params: BlockQueryParams, connection: Knex): Promise<knex.QueryBuilder> {
  const { id, ids, limit, offset, select, before, sortOrder, minHeight, maxHeight } = params;

  const query = connection.queryBuilder().select(select).from('blocks');

  if (id) {
    query.where('blocks.id', id);
  }

  if (ids) {
    query.whereIn('blocks.id', ids);
  }

  if (before) {
    query.where('blocks.created_at', '<', before);
  }

  if (minHeight && minHeight >= 0) {
    query.where('blocks.height', '>=', minHeight);
  }

  if (maxHeight && maxHeight >= 0) {
    query.where('blocks.height', '<=', maxHeight);
  }

  if (limit) {
    query.limit(limit);
  }

  if (offset) {
    query.offset(offset);
  }

  if (sortOrder) {
    if (Object.keys(blockOrderByClauses).includes(sortOrder)) {
      query.orderByRaw(blockOrderByClauses[sortOrder]);
    }
  }

  return query;
}
