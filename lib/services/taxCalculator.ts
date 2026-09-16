import { DocumentItem } from '../types';

/**
 * Redondeo financiero exacto a 2 decimales para evitar problemas de punto flotante en JS.
 */
export function roundMoney(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export interface TaxCalculationParams {
  items: DocumentItem[];
  discountRate?: number; // Descuento global en %
  taxRate?: number;      // IVA global en % (0%, 5%, 19%)
  retentionApplied?: boolean;
  retentionRate?: number; // ReteFuente en % (2.5%, 3.5%, 4.0%, 10%, 11%)
}

export interface TaxCalculationSummary {
  subtotal: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  taxAmount: number;
  retentionAmount: number;
  totalAmount: number;
  amountInWords: string;
}

/**
 * Servicio puro de Cálculo Financiero y Tributario (SRP)
 */
export function calculateDocumentSummary({
  items,
  discountRate = 0,
  taxRate = 0,
  retentionApplied = false,
  retentionRate = 0,
}: TaxCalculationParams): TaxCalculationSummary {
  const safeDiscountRate = Math.max(0, Math.min(100, Number(discountRate) || 0));
  const safeTaxRate = Math.max(0, Math.min(100, Number(taxRate) || 0));
  const safeRetentionRate = Math.max(0, Math.min(100, Number(retentionRate) || 0));

  // 1. Subtotal de Ítems
  const subtotal = items.reduce((acc, item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const unitPrice = Math.max(0, Number(item.unit_price) || 0);
    const itemTotal = roundMoney(qty * unitPrice);
    return roundMoney(acc + itemTotal);
  }, 0);

  // 2. Descuento Global
  const discountAmount = roundMoney(subtotal * (safeDiscountRate / 100));
  const subtotalAfterDiscount = roundMoney(subtotal - discountAmount);

  // 3. Impuesto (IVA)
  const taxAmount = roundMoney(subtotalAfterDiscount * (safeTaxRate / 100));

  // 4. Retención en la Fuente (ReteFuente)
  const retentionAmount = retentionApplied
    ? roundMoney(subtotalAfterDiscount * (safeRetentionRate / 100))
    : 0;

  // 5. Total Neto
  const totalAmount = roundMoney(subtotalAfterDiscount + taxAmount - retentionAmount);

  // 6. Conversión a Letras
  const amountInWords = numberToWordsCOP(totalAmount);

  return {
    subtotal,
    discountAmount,
    subtotalAfterDiscount,
    taxAmount,
    retentionAmount,
    totalAmount,
    amountInWords,
  };
}

/**
 * Convierte un número en Pesos Colombianos (COP) a su representación en letras.
 * Ej: 1500000 -> "UN MILLÓN QUINIENTOS MIL PESOS M/CTE"
 */
export function numberToWordsCOP(amount: number): string {
  const intAmount = Math.floor(Math.abs(amount));
  if (intAmount === 0) return 'CERO PESOS M/CTE';

  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const teens = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function convertGroup(n: number): string {
    let output = '';

    if (n === 100) return 'CIEN';
    if (n > 100) {
      output += hundreds[Math.floor(n / 100)] + ' ';
      n %= 100;
    }

    if (n >= 10 && n <= 19) {
      output += teens[n - 10] + ' ';
      return output.trim();
    }

    if (n >= 20 && n <= 29) {
      if (n === 20) return output + 'VEINTE';
      return output + 'VEINTI' + units[n - 20];
    }

    if (n >= 30) {
      output += tens[Math.floor(n / 10)];
      if (n % 10 !== 0) {
        output += ' Y ' + units[n % 10];
      }
      return output.trim();
    }

    if (n > 0) {
      output += units[n];
    }

    return output.trim();
  }

  function convertNumber(n: number): string {
    if (n === 0) return '';
    let result = '';

    // Millones
    const millions = Math.floor(n / 1000000);
    if (millions > 0) {
      if (millions === 1) {
        result += 'UN MILLÓN ';
      } else {
        result += convertGroup(millions) + ' MILLONES ';
      }
      n %= 1000000;
    }

    // Miles
    const thousands = Math.floor(n / 1000);
    if (thousands > 0) {
      if (thousands === 1) {
        result += 'UN MIL ';
      } else {
        result += convertGroup(thousands) + ' MIL ';
      }
      n %= 1000;
    }

    // Unidades
    if (n > 0) {
      result += convertGroup(n) + ' ';
    }

    return result.trim();
  }

  const text = convertNumber(intAmount);
  return `${text} PESOS M/CTE`;
}
