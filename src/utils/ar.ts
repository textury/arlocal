import { BigNumber } from 'bignumber.js';

export function winstonToAr(
  winstonString: string,
  { formatted = false, decimals = 12, trim = true } = {}
) {
  const num = stringToBigNum(winstonString, decimals).shiftedBy(-12);

  return formatted ? num.toFormat(decimals) : num.toFixed(decimals);
}

export function arToWinston(arString: string, { formatted = false } = {}) {
  const num = stringToBigNum(arString).shiftedBy(12);

  return formatted ? num.toFormat() : num.toFixed(0);
}

export function stringToBigNum(
  stringValue: string,
  decimalPlaces: number = 12
): BigNumber {
  return this.BigNum(stringValue, decimalPlaces);
}