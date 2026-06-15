// BACEN PIX EMV QR Code generator
// Reference: Manual de Padrões para Iniciação do PIX - BACEN

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export interface PixQrCodeOptions {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount?: string;
  txId?: string;
  description?: string;
  isStatic?: boolean;
}

export function generatePixQrCode(opts: PixQrCodeOptions): string {
  // ID 26 - Merchant Account Information (PIX)
  const merchantAccountInfo = [
    tlv('00', 'br.gov.bcb.pix'),
    tlv('01', opts.pixKey),
    ...(opts.description ? [tlv('02', opts.description.substring(0, 36))] : []),
  ].join('');

  // ID 62 - Additional Data Field
  const txId = opts.txId?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || '***';
  const additionalData = tlv('05', txId);

  const parts = [
    tlv('00', '01'), // Payload Format Indicator
    tlv('01', opts.isStatic ? '11' : '12'), // Point of Initiation Method
    tlv('26', merchantAccountInfo), // Merchant Account Info
    tlv('52', '0000'), // MCC
    tlv('53', '986'), // Transaction Currency (BRL)
    ...(opts.amount ? [tlv('54', opts.amount)] : []),
    tlv('58', 'BR'), // Country Code
    tlv('59', opts.merchantName.substring(0, 25)),
    tlv('60', opts.merchantCity.substring(0, 15)),
    tlv('62', additionalData),
    '6304', // CRC placeholder
  ];

  const payload = parts.join('');
  const crc = crc16(payload);
  return payload.replace('6304', `6304${crc}`);
}
