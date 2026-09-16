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

export function formatDateShort(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function generateNextNumber(type: 'quotation' | 'bill', count: number): string {
  const prefix = type === 'quotation' ? 'COT' : 'CC';
  const nextNum = (count + 1).toString().padStart(3, '0');
  return `${prefix}-${nextNum}`;
}

export const DEFAULT_DOCUMENT_SUBTITLE = 
  'MODELO DE DOCUMENTO EQUIVALENTE A FACTURA (Art. 3 Decreto 522 de Marzo de 2003)';

export const DEFAULT_LEGAL_TEXT = 
  'Informo que no tengo contratado 2 o más personas asociadas a mi actividad como independiente, razón por la cual solicito se me aplique la retención en la fuente del artículo 383 del Estatuto Tributario y siguientes.';

export const DEFAULT_PROFILE = {
  razon_social: '',
  document_type: 'CC',
  document_number: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  bank_name: 'Bancolombia',
  account_type: 'Ahorros',
  account_number: '',
  account_holder_name: '',
  account_holder_doc: '',
  document_subtitle: DEFAULT_DOCUMENT_SUBTITLE,
  legal_text: DEFAULT_LEGAL_TEXT,
  signature_url: '',
};
