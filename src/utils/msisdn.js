// Mirrors tasaf_payment/msisdn.py: Tanzanian mobile numbers are stored as 255 + 9 digits starting with 6 or 7.
const MSISDN_RE = /^255[67]\d{8}$/;

export function normaliseMsisdn(value) {
  const digits = (value || '').replace(/[\s\-().+]/g, '');
  if (/^0[67]\d{8}$/.test(digits)) return `255${digits.slice(1)}`;
  if (/^[67]\d{8}$/.test(digits)) return `255${digits}`;
  return digits;
}

export const isValidMsisdn = (value) => MSISDN_RE.test(value || '');
