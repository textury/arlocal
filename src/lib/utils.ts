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
}