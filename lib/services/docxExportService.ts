import {
  Document,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  ImageRun,
  Packer,
} from 'docx';
import { DocumentWithDetails, Profile } from '../types';
import { formatCOP, formatDate, DEFAULT_DOCUMENT_SUBTITLE } from '../utils';

function base64ToUint8Array(base64: string): Uint8Array | null {
  try {
    const base64Data = base64.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error('Error convirtiendo imagen de firma base64:', e);
    return null;
  }
}

export async function generateCuentaDeCobroDocx(
  doc: DocumentWithDetails,
  profile: Profile
): Promise<Blob> {
  const isBill = doc.type === 'bill';
  const docTypeName = isBill ? 'CUENTA DE COBRO' : 'COTIZACIÓN';
  const clientName = doc.clients?.name || 'CLIENTE NO ESPECIFICADO';
  const clientCity = doc.clients?.city || profile.city || 'Medellín';
  const clientDoc = doc.clients
    ? `${doc.clients.document_type || 'C.C./NIT'}: ${doc.clients.document_number}`
    : '';

  const subtitle =
    profile.document_subtitle || DEFAULT_DOCUMENT_SUBTITLE;
  const legalText =
    profile.legal_text ||
    'Informo que no tengo contratado 2 o más personas asociadas a mi actividad como independiente, razón por la cual solicito se me aplique la retención en la fuente del artículo 383 del Estatuto Tributario y siguientes.';

  const bankHolder = profile.account_holder_name || profile.razon_social;
  const consignmentText = `Favor consignar a la cuenta del ${profile.bank_name} ${profile.account_type} ${profile.account_number}, a nombre de ${bankHolder}`;

  // 1. Párrafos de Título y Subtítulo
  const titleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text: `${docTypeName} N° ${doc.number}`,
        bold: true,
        size: 32, // 16pt
        font: 'Arial',
        color: '1E293B',
      }),
    ],
  });

  const subtitleParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 300 },
    children: [
      new TextRun({
        text: subtitle,
        bold: true,
        size: 18, // 9pt
        font: 'Arial',
        color: '475569',
      }),
    ],
  });

  // 2. Encabezado de Cliente y DEBE A
  const clientHeaderParagraph = new Paragraph({
    spacing: { before: 150, after: 80 },
    children: [
      new TextRun({
        text: clientName.toUpperCase(),
        bold: true,
        size: 24, // 12pt
        font: 'Arial',
      }),
    ],
  });

  const clientSubHeaderParagraph = new Paragraph({
    spacing: { before: 0, after: 200 },
    children: [
      new TextRun({
        text: clientCity,
        size: 20, // 10pt
        font: 'Arial',
      }),
      ...(clientDoc
        ? [
            new TextRun({
              text: `  (${clientDoc})`,
              size: 20,
              font: 'Arial',
              color: '64748B',
            }),
          ]
        : []),
    ],
  });

  const debeAParagraph = new Paragraph({
    spacing: { before: 200, after: 60 },
    children: [
      new TextRun({
        text: 'DEBE A',
        bold: true,
        size: 22, // 11pt
        font: 'Arial',
        color: '0F172A',
      }),
    ],
  });

  const issuerNameParagraph = new Paragraph({
    spacing: { before: 0, after: 40 },
    children: [
      new TextRun({
        text: profile.razon_social,
        bold: true,
        size: 22,
        font: 'Arial',
      }),
    ],
  });

  const issuerDocParagraph = new Paragraph({
    spacing: { before: 0, after: 300 },
    children: [
      new TextRun({
        text: `${profile.document_type}: ${profile.document_number}`,
        size: 20,
        font: 'Arial',
        color: '334155',
      }),
    ],
  });

  // 3. Franja "La suma de"
  const amountInWordsText = doc.amount_in_words
    ? doc.amount_in_words
    : '';

  const amountParagraph = new Paragraph({
    spacing: { before: 200, after: 300 },
    children: [
      new TextRun({
        text: 'La suma de: ',
        bold: true,
        size: 22,
        font: 'Arial',
      }),
      new TextRun({
        text: `${amountInWordsText.toUpperCase()} `,
        bold: true,
        size: 20,
        font: 'Arial',
      }),
      new TextRun({
        text: `(${formatCOP(doc.total_amount)}) M/L`,
        bold: true,
        size: 22,
        font: 'Arial',
        color: '1E40AF',
      }),
    ],
  });

  // 4. Construcción de Tabla de Ítems
  const tableHeaderRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        shading: { fill: '1E293B' },
        margins: { top: 120, bottom: 120, left: 150, right: 150 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Concepto / Descripción',
                bold: true,
                color: 'FFFFFF',
                size: 20,
                font: 'Arial',
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: { fill: '1E293B' },
        margins: { top: 120, bottom: 120, left: 150, right: 150 },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'Valor Unitario',
                bold: true,
                color: 'FFFFFF',
                size: 20,
                font: 'Arial',
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: { fill: '1E293B' },
        margins: { top: 120, bottom: 120, left: 150, right: 150 },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'Valor Total',
                bold: true,
                color: 'FFFFFF',
                size: 20,
                font: 'Arial',
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const itemRows: TableRow[] = (doc.document_items || []).map((item, idx) => {
    const isEven = idx % 2 === 0;
    const descText =
      item.quantity > 1
        ? `${item.description} (${item.quantity} unds. c/u = ${formatCOP(item.unit_price)})`
        : item.description;

    return new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { fill: isEven ? 'FFFFFF' : 'F8FAFC' },
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: descText,
                  size: 20,
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: isEven ? 'FFFFFF' : 'F8FAFC' },
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: formatCOP(item.unit_price),
                  size: 20,
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          shading: { fill: isEven ? 'FFFFFF' : 'F8FAFC' },
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: formatCOP(item.total_price),
                  bold: true,
                  size: 20,
                  font: 'Arial',
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  // Fila Total Tabla
  const totalRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 75, type: WidthType.PERCENTAGE },
        columnSpan: 2,
        shading: { fill: 'F1F5F9' },
        margins: { top: 120, bottom: 120, left: 150, right: 150 },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: 'Total',
                bold: true,
                size: 22,
                font: 'Arial',
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: { fill: 'F1F5F9' },
        margins: { top: 120, bottom: 120, left: 150, right: 150 },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: formatCOP(doc.total_amount),
                bold: true,
                size: 22,
                font: 'Arial',
                color: '1E40AF',
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [tableHeaderRow, ...itemRows, totalRow],
  });

  // 5. Declaración Juramentada
  const legalParagraph = new Paragraph({
    spacing: { before: 350, after: 200 },
    children: [
      new TextRun({
        text: legalText,
        size: 19, // 9.5pt
        font: 'Arial',
        color: '334155',
      }),
    ],
  });

  // 6. Datos de Consignación
  const consignmentParagraph = new Paragraph({
    spacing: { before: 150, after: 250 },
    children: [
      new TextRun({
        text: consignmentText,
        bold: true,
        size: 20, // 10pt
        font: 'Arial',
        color: '065F46',
      }),
    ],
  });

  // 7. Fecha y Ciudad
  const formattedDateStr = formatDate(doc.date);
  const cityDateParagraph = new Paragraph({
    spacing: { before: 200, after: 350 },
    children: [
      new TextRun({
        text: `Fecha: ${profile.city || 'Medellín'}, ${formattedDateStr}`,
        bold: true,
        size: 20,
        font: 'Arial',
      }),
    ],
  });

  // 8. Cierre "Cordialmente," y Firma
  const cordialmentParagraph = new Paragraph({
    spacing: { before: 200, after: 150 },
    children: [
      new TextRun({
        text: 'Cordialmente,',
        size: 22,
        font: 'Arial',
      }),
    ],
  });

  // Firma Imagen si está disponible
  let signatureElement: Paragraph | null = null;
  if (profile.signature_url) {
    const signatureBytes = base64ToUint8Array(profile.signature_url);
    if (signatureBytes) {
      const isJpeg = profile.signature_url.includes('image/jpeg') || profile.signature_url.includes('image/jpg');
      signatureElement = new Paragraph({
        spacing: { before: 100, after: 100 },
        children: [
          new ImageRun({
            data: signatureBytes,
            transformation: { width: 170, height: 55 },
            type: isJpeg ? 'jpg' : 'png',
          }),
        ],
      });
    }
  }

  const signeeNameParagraph = new Paragraph({
    spacing: { before: 100, after: 40 },
    children: [
      new TextRun({
        text: `Nombre:  ${profile.razon_social}`,
        bold: true,
        size: 21,
        font: 'Arial',
      }),
    ],
  });

  const signeeDocParagraph = new Paragraph({
    spacing: { before: 0, after: 40 },
    children: [
      new TextRun({
        text: `${profile.document_type}. ${profile.document_number}`,
        size: 20,
        font: 'Arial',
      }),
    ],
  });

  const signeePhoneParagraph = new Paragraph({
    spacing: { before: 0, after: 100 },
    children: [
      new TextRun({
        text: `Cel. ${profile.phone}`,
        size: 20,
        font: 'Arial',
      }),
    ],
  });

  // Document Assembly
  const docxDocument = new Document({
    sections: [
      {
        properties: {},
        children: [
          titleParagraph,
          subtitleParagraph,
          clientHeaderParagraph,
          clientSubHeaderParagraph,
          debeAParagraph,
          issuerNameParagraph,
          issuerDocParagraph,
          amountParagraph,
          itemsTable,
          legalParagraph,
          consignmentParagraph,
          cityDateParagraph,
          cordialmentParagraph,
          ...(signatureElement ? [signatureElement] : []),
          signeeNameParagraph,
          signeeDocParagraph,
          signeePhoneParagraph,
        ],
      },
    ],
  });

  return await Packer.toBlob(docxDocument);
}

export function downloadDocxBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
