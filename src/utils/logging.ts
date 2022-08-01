import { appendFileSync, existsSync, unlinkSync } from 'fs';

export default class Logging {
  _log: boolean = false;

  constructor(showLogs: boolean, persist: boolean) {
    this._log = showLogs;
    if (!persist) {
      if (existsSync('./logs')) unlinkSync('./logs');
    }
  }
  public logInFile(args: any[]) {
    if (args.length > 3 && args[2] !== '/logs') {
      const log = `[${new Date().toLocaleString()}] ${args.slice(1, 5).join(' ')} \n`;
      appendFileSync('./logs', log);
    }
  }
  public log(...args: any[]): void {
    this.show('log', ...args);
  }

  public info(...args: any[]): void {
    this.show('info', ...args);
  }

  public warn(...args: any[]): void {
    this.show('warn', ...args);
  }

  public error(...args: any[]): void {
    this.show('error', ...args);
  }

  private show(type: 'log' | 'info' | 'warn' | 'error', ...args: any[]) {
    if (this._log) {
      console[type](`[${new Date().toLocaleString()}]`, ...args);
    }
  }
}
