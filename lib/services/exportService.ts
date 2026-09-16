import { DocumentWithDetails } from '../types';
import { formatCOP, formatDate } from '../utils';

/**
 * Servicio para Exportación a Excel (CSV con soporte UTF-8 BOM) y Enlaces de WhatsApp
 */

export function exportDocumentsToCSV(documents: DocumentWithDetails[], fileName = 'reporte-cotizaciones-cuentas.csv') {
  if (!documents || documents.length === 0) return;

  const headers = [
    'Número',
    'Tipo',
    'Cliente',
    'NIT / Doc. Cliente',
    'Fecha Emisión',
    'Fecha Vencimiento',
    'Subtotal',
    'Descuento ($)',
    'IVA ($)',
    'ReteFuente ($)',
    'Total Neto ($)',
    'Estado',
  ];

  const rows = documents.map((doc) => {
    const isBill = doc.type === 'bill';
    return [
      `"${doc.number}"`,
      `"${isBill ? 'Cuenta de Cobro' : 'Cotización'}"`,
      `"${(doc.clients?.name || 'N/A').replace(/"/g, '""')}"`,
      `"${doc.clients?.document_number || 'N/A'}"`,
      `"${doc.date}"`,
      `"${doc.due_date || ''}"`,
      doc.subtotal || 0,
      doc.discount_amount || 0,
      doc.tax_amount || 0,
      doc.retention_amount || 0,
      doc.total_amount || 0,
      `"${doc.status.toUpperCase()}"`,
    ].join(',');
  });

  // Agregar BOM para UTF-8 para que Excel abra acentos y caracteres especiales correctamente
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateWhatsAppShareLink(doc: DocumentWithDetails, phone?: string): string {
  const isBill = doc.type === 'bill';
  const docTypeName = isBill ? 'Cuenta de Cobro' : 'Cotización';
  const clientName = doc.clients?.name || 'Estimado(a) cliente';

  const lines = [
    `Hola ${clientName}, adjunto el detalle de la *${docTypeName} N° ${doc.number}*:`,
    '',
    `*Fecha:* ${formatDate(doc.date)}`,
    ...(doc.due_date ? [`*Vencimiento:* ${formatDate(doc.due_date)}`] : []),
    `*Valor Neto:* ${formatCOP(doc.total_amount)}`,
    '',
    `Quedo atento a tus comentarios o confirmación. ¡Muchas gracias!`,
  ];

  const fullText = lines.join('\n');
  const encodedMessage = encodeURIComponent(fullText);

  let targetPhone = (phone || doc.clients?.phone || '').replace(/[^0-9]/g, '');

  // Formateo para número colombiano (10 dígitos que empiezan por 3 -> agregar prefijo 57)
  if (targetPhone.length === 10 && targetPhone.startsWith('3')) {
    targetPhone = '57' + targetPhone;
  }

  // Verificar si es un número internacional válido (7 a 15 dígitos)
  const isValidPhone = targetPhone.length >= 7 && targetPhone.length <= 15;

  if (isValidPhone) {
    return `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodedMessage}`;
  }

  return `https://api.whatsapp.com/send?text=${encodedMessage}`;
}

export function generateEmailShareLink(doc: DocumentWithDetails, profile?: { razon_social?: string; bank_name?: string; account_type?: string; account_number?: string; document_type?: string; document_number?: string; phone?: string } | null): string {
  const isBill = doc.type === 'bill';
  const docTypeName = isBill ? 'Cuenta de Cobro' : 'Cotización';
  const clientName = doc.clients?.name || 'Estimado(a) cliente';
  const clientEmail = doc.clients?.email || '';

  const subject = `[${docTypeName} N° ${doc.number}] - ${profile?.razon_social || 'GST Cotizaciones & Cobros'}`;

  let body = `Hola ${clientName},\n\n`;
  body += `Adjunto el detalle de la ${docTypeName} N° ${doc.number}:\n\n`;
  body += `• Fecha de Emisión: ${formatDate(doc.date)}\n`;
  if (doc.due_date) {
    body += `• Fecha de Vencimiento: ${formatDate(doc.due_date)}\n`;
  }
  body += `• Valor Neto a Pagar: ${formatCOP(doc.total_amount)}\n\n`;

  if (isBill && profile?.bank_name && profile?.account_number) {
    body += `INFORMACIÓN BANCARIA PARA CONSIGNACIÓN:\n`;
    body += `Banco: ${profile.bank_name}\n`;
    body += `Tipo de Cuenta: ${profile.account_type}\n`;
    body += `N° de Cuenta: ${profile.account_number}\n`;
    body += `Titular: ${profile.razon_social} (${profile.document_type} ${profile.document_number})\n\n`;
  }

  body += `Quedamos atentos a sus comentarios o confirmación de pago.\n\n`;
  body += `Cordialmente,\n`;
  body += `${profile?.razon_social || ''}\n`;
  if (profile?.phone) body += `Tel: ${profile.phone}\n`;

  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  if (clientEmail) {
    return `mailto:${clientEmail}?subject=${encodedSubject}&body=${encodedBody}`;
  }
  return `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
}
