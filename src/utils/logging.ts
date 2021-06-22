export default class Logging {
  _log: boolean = false;

  constructor(showLogs: boolean = true) {
    this._log = showLogs;
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
      console[type](`[${(new Date()).toLocaleString()}]`, ...args);
    }
  }
}