import { PixKeyType } from '@prisma/client';

function isValidCpf(cpf: string): boolean {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(c[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(c[10]);
}

function isValidCnpj(cnpj: string): boolean {
  const c = cnpj.replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const calc = (s: string, w: number[]) =>
    s.split('').reduce((a, d, i) => a + parseInt(d) * w[i], 0);
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = 11 - (calc(c.substring(0, 12), w1) % 11);
  const d2 = 11 - (calc(c.substring(0, 13), w2) % 11);
  return parseInt(c[12]) === (d1 >= 10 ? 0 : d1) && parseInt(c[13]) === (d2 >= 10 ? 0 : d2);
}

export function validatePixKey(keyType: PixKeyType, keyValue: string): { valid: boolean; error?: string; normalized?: string } {
  switch (keyType) {
    case 'CPF': {
      const normalized = keyValue.replace(/\D/g, '');
      if (!isValidCpf(normalized)) return { valid: false, error: 'CPF inválido' };
      return { valid: true, normalized };
    }
    case 'CNPJ': {
      const normalized = keyValue.replace(/\D/g, '');
      if (!isValidCnpj(normalized)) return { valid: false, error: 'CNPJ inválido' };
      return { valid: true, normalized };
    }
    case 'EMAIL': {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(keyValue)) return { valid: false, error: 'E-mail inválido' };
      return { valid: true, normalized: keyValue.toLowerCase() };
    }
    case 'PHONE': {
      const normalized = keyValue.replace(/\D/g, '');
      if (!/^55\d{10,11}$/.test(normalized)) return { valid: false, error: 'Telefone inválido. Use formato +55DDDNNNNNNNNN' };
      return { valid: true, normalized: `+${normalized}` };
    }
    case 'EVP': {
      const re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!re.test(keyValue)) return { valid: false, error: 'EVP deve ser um UUID v4 válido' };
      return { valid: true, normalized: keyValue.toLowerCase() };
    }
    default:
      return { valid: false, error: 'Tipo de chave inválido' };
  }
}
