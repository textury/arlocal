import { Tag } from '../graphql/types';
import { fromB64Url } from './encoding';

export class Utils {
  static randomID(len?: number): string {
    // tslint:disable-next-line: no-bitwise
    return [...Array(len || 43)].map(() => (~~(Math.random() * 36)).toString(36)).join('');
  }

  static atob(a: string) {
    return Buffer.from(a, 'base64').toString('binary');
  }

  static btoa(b: string) {
    return Buffer.from(b).toString('base64');
  }

  static tagValue(tags: Tag[], name: string): string {
    for (const tag of tags) {
      if (fromB64Url(tag.name).toString().toLowerCase() === name.toLowerCase()) {
        return fromB64Url(tag.value).toString();
      }
    }
    return '';
  }
}

export const groupBy = (obj, key) => {
  return obj.reduce((rv, x) => {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

export function concatBuffers(buffers: Uint8Array[] | ArrayBuffer[]): Uint8Array {
  let totalLength = 0;

  for (const buffer of buffers) {
    totalLength += buffer.byteLength;
  }

  const temp = new Uint8Array(totalLength);
  let offset = 0;

  temp.set(new Uint8Array(buffers[0]), offset);
  offset += buffers[0].byteLength;

  for (let i = 1; i < buffers.length; i++) {
    temp.set(new Uint8Array(buffers[i]), offset);
    offset += buffers[i].byteLength;
  }

  return temp;
}
