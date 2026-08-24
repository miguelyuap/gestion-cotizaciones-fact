import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCOP(amount: number): string {
  if (isNaN(amount)) return '$ 0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function generateNextNumber(type: 'quotation' | 'bill', count: number): string {
  const prefix = type === 'quotation' ? 'COT' : 'CC';
  const nextNum = (count + 1).toString().padStart(3, '0');
  return `${prefix}-${nextNum}`;
}

export const DEFAULT_LEGAL_TEXT = 
  'Hago constar bajo la gravedad de juramento que no he contratado o vinculado dos (2) o más trabajadores o contratistas asociados a mi actividad económica por un término igual o superior a noventa (90) días continuos o discontinuos dentro del mismo año gravable (Art. 383 del Estatuto Tributario y Decreto 522 de 2003). Persona Natural No Responsable de IVA (Art. 437 Parágrafo 3 del E.T.).';

export const DEFAULT_PROFILE = {
  razon_social: 'CARLOS ALBERTO GÓMEZ PÉREZ',
  document_type: 'CC',
  document_number: '1020304050',
  phone: '+57 310 987 6543',
  email: 'carlos.gomez@ejemplo.com',
  address: 'Carrera 7 # 72-10, Apto 502',
  city: 'Bogotá D.C., Colombia',
  bank_name: 'Bancolombia',
  account_type: 'Ahorros',
  account_number: '241-000123-88',
  legal_text: DEFAULT_LEGAL_TEXT,
};
