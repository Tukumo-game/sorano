export const NG_CODES = [
  'USD', 'JPY', 'EUR', 'BTC', 'ETH', 'DOGE', 'AUD', 'CAD', 'CNY', 'KRW'
];

export function isForbiddenCode(code: string) {
  return NG_CODES.includes(code.toUpperCase());
}
