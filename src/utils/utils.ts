import { Tag } from "../graphql/types";
import { fromB64Url } from "./encoding";

export class Utils {
  static randomID(len: number = 43): string {
    return [...Array(43)].map(i => (~~(Math.random() * 36)).toString(36)).join('');
  }

  static atob(a: string) {
    return Buffer.from(a, 'base64').toString('binary');
  }

  static btoa(b: string) {
    return Buffer.from(b).toString('base64');
  }

  static tagValue(tags: Array<Tag>, name: string): string {
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      if (fromB64Url(tag.name).toString().toLowerCase() === name.toLowerCase()) {
        return fromB64Url(tag.value).toString();
      }
    }
    return '';
  }
}