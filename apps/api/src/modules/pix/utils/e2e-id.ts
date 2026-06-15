// E2E ID format: E{8-ISPB}{YYYYMMDDHHSS}{11-alphanum}
// For sandbox we use ISPB 00000000

export function generateE2eId(): string {
  const ispb = '00000000';
  const now = new Date();
  const pad = (n: number, l = 2) => n.toString().padStart(l, '0');
  const date = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;
  const random = Math.random().toString(36).substring(2, 13).toUpperCase().padEnd(11, '0');
  return `E${ispb}${date}${random}`;
}
