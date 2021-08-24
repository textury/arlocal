import { TagFilter } from 'graphql/types';
import { Base64UrlEncodedString, WinstonString, fromB64Url } from '../utils/encoding';

export interface Tag {
  name: Base64UrlEncodedString;
  value: Base64UrlEncodedString;
}

export interface TransactionType {
  format: number;
  id: string;
  height?: number;
  last_tx: string;
  owner: string;
  tags: Tag[];
  target: string;
  quantity: WinstonString;
  data: Base64UrlEncodedString;
  data_size: string;
  data_tree: string[];
  data_root: string;
  reward: string;
  signature: string;
}

export function toB64url(input: string): Base64UrlEncodedString {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}


export function tagValue(tags: Tag[], name: string): string {
  for (const tag of tags) {
    if (fromB64Url(tag.name).toString().toLowerCase() === name.toLowerCase()) {
      return fromB64Url(tag.value).toString();
    }
  }

  return '';
}

export function tagToUTF8(tags: Tag[]): Tag[] {
  const conversion: Tag[] = [];

  for (const tag of tags) {
    conversion.push({
      name: fromB64Url(tag.name).toString(),
      value: fromB64Url(tag.value).toString(),
    });
  }

  return conversion;
}

export function tagToB64(tags: TagFilter[]): TagFilter[] {
  const conversion: TagFilter[] = [];

  for (const tag of tags) {
    conversion.push({
      name: toB64url(tag.name),
      values: tag.values.map((v) => toB64url(v)),
    });
  }

  return conversion;
}