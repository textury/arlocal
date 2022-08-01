import { BigNumber } from 'bignumber.js';

export function winstonToAr(winstonString: string, { formatted = false, decimals = 12 } = {}) {
  const num = stringToBigNum(winstonString).shiftedBy(-12);

  return formatted ? num.toFormat(decimals) : num.toFixed(decimals);
}

export function arToWinston(arString: string, { formatted = false } = {}) {
  const num = stringToBigNum(arString).shiftedBy(12);

  return formatted ? num.toFormat() : num.toFixed(0);
}

export function stringToBigNum(stringValue: string): BigNumber {
  return new BigNumber(stringValue); // second argument is base, defaulted to base 10
}
