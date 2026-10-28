import QRCode from 'qrcode';
import { Machine } from '../types';

export function formatMachineQRData(m: Machine): string {
  return `${m.code}|${m.name}|${m.type}|${m.brand}|${m.model}|${m.serial}|${m.status}|${m.location}`;
}

export async function generateQRCodeDataURL(data: string, width = 300): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.warn('Local QR generation error, using fallback:', err);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${width}x${width}&data=${encodeURIComponent(data)}`;
  }
}
