/* eslint-disable @next/next/no-img-element */
import { DocumentWithDetails, Profile } from '@/lib/types';
import { formatCOP, formatDate } from '@/lib/utils';

interface PrintTicketProps {
  document: DocumentWithDetails;
  profile: Profile;
}

export default function PrintTicket({ document: doc, profile }: PrintTicketProps) {
  const isBill = doc.type === 'bill';

  return (
    <div className="bg-white text-black p-4 max-w-[320px] mx-auto shadow-md print:shadow-none print:p-0 ticket-container font-mono text-xs leading-tight">
      
      {/* Encabezado Emisor */}
      <div className="text-center font-bold uppercase tracking-tighter border-b border-dashed border-black pb-2 mb-2">
        <p className="text-sm font-extrabold">{profile.razon_social}</p>
        <p className="text-[10px] font-normal">{profile.document_type}: {profile.document_number}</p>
        <p className="text-[10px] font-normal">{profile.phone}</p>
        <p className="text-[10px] font-normal">{profile.city}</p>
      </div>

      {/* Tipo de Documento y Consecutivo */}
      <div className="text-center my-2 font-bold uppercase">
        <p className="text-xs">{isBill ? 'CUENTA DE COBRO' : 'COTIZACIÓN'}</p>
        <p className="text-sm font-extrabold">{doc.number}</p>
        <p className="text-[10px] font-normal">{formatDate(doc.date)}</p>
      </div>

      {/* Datos del Cliente y Debe A */}
      <div className="border-t border-b border-dashed border-black py-2 my-2 text-[11px] space-y-2">
        <div>
          <p className="font-bold uppercase text-[10px] text-slate-700">CLIENTE / DEUDOR:</p>
          <p className="font-bold">{doc.clients?.name || 'Cliente Ocasional'}</p>
          <p className="text-[10px]">
            {doc.clients?.document_type || 'NIT/CC'}: {doc.clients?.document_number || 'N/A'}
          </p>
          {doc.clients?.phone && <p className="text-[10px]">Tel: {doc.clients.phone}</p>}
        </div>

        {isBill && (
          <div className="border-t border-dashed border-slate-300 pt-1.5">
            <p className="font-bold uppercase text-[10px] text-blue-800">DEBE A (COBRADOR):</p>
            <p className="font-bold">{profile.razon_social}</p>
            <p className="text-[10px]">{profile.document_type}: {profile.document_number}</p>
          </div>
        )}
      </div>

      {/* Detalle de Ítems */}
      <div className="my-2">
        <div className="flex justify-between font-bold text-[10px] uppercase border-b border-black pb-1 mb-1">
          <span>CANT - DESCRIPCIÓN</span>
          <span className="text-right">TOTAL</span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          {doc.document_items && doc.document_items.length > 0 ? (
            doc.document_items.map((item, idx) => (
              <div key={idx} className="border-b border-slate-200 pb-1 last:border-0">
                <p className="font-medium leading-tight">{item.description}</p>
                <div className="flex justify-between text-[10px] text-slate-700">
                  <span>{item.quantity} x {formatCOP(item.unit_price)}</span>
                  <span className="font-bold text-black">{formatCOP(item.total_price)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[10px] italic text-center">Sin ítems</p>
          )}
        </div>
      </div>

      {/* Totales */}
      <div className="border-t border-black pt-2 my-2 space-y-1">
        <div className="flex justify-between text-[11px]">
          <span>Subtotal:</span>
          <span className="font-bold">{formatCOP(doc.subtotal)}</span>
        </div>

        {doc.discount_rate ? doc.discount_rate > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>(-) Desc ({doc.discount_rate}%):</span>
            <span>-{formatCOP(doc.discount_amount || 0)}</span>
          </div>
        ) : null}

        {doc.tax_rate ? doc.tax_rate > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>(+) IVA ({doc.tax_rate}%):</span>
            <span>+{formatCOP(doc.tax_amount || 0)}</span>
          </div>
        ) : null}

        {doc.retention_applied && doc.retention_amount > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>(-) ReteFuente ({doc.retention_rate}%):</span>
            <span>-{formatCOP(doc.retention_amount)}</span>
          </div>
        )}

        <div className="flex justify-between text-xs font-extrabold border-t border-dashed border-black pt-1">
          <span>{isBill ? 'NETO A PAGAR:' : 'TOTAL:'}</span>
          <span>{formatCOP(doc.total_amount)}</span>
        </div>

        {doc.amount_in_words && (
          <p className="text-[8px] text-center italic border-t border-slate-300 pt-1 uppercase">
            SON: {doc.amount_in_words}
          </p>
        )}
      </div>

      {/* Datos de Cuenta Bancaria */}
      {isBill && (
        <div className="border border-black p-1.5 my-2 text-[10px] text-center">
          <p className="font-bold">TRANSFERIR A BANCOLOMBIA:</p>
          <p>{profile.account_type}: {profile.account_number}</p>
          <p>Titular: {profile.razon_social}</p>
        </div>
      )}

      {/* Texto Normativo Reducido */}
      {isBill && (
        <div className="text-[9px] text-center leading-tight my-2 text-slate-700">
          <p>Régimen No Responsable de IVA</p>
          <p>(Art. 383 E.T. / Dec. 522/2003)</p>
        </div>
      )}

      {/* Firma Digital en Ticket POS */}
      <div className="text-center border-t border-dashed border-black pt-3 my-2">
        {profile.signature_url ? (
          <div className="flex justify-center mb-1">
            <img
              src={profile.signature_url}
              alt="Firma"
              className="max-h-12 max-w-[140px] object-contain"
            />
          </div>
        ) : (
          <div className="border-b border-black w-36 mx-auto mb-1 h-6"></div>
        )}
        <p className="font-bold text-[10px] uppercase">{profile.razon_social}</p>
        <p className="text-[9px]">{profile.document_type}: {profile.document_number}</p>
      </div>

      {/* Pie de página del ticket */}
      <div className="text-center border-t border-dashed border-black pt-2 mt-2 text-[9px]">
        <p className="font-bold">¡GRACIAS POR SU CONFIANZA!</p>
        <p className="text-[8px] text-slate-500">GST Cotizaciones & Cobros</p>
      </div>

    </div>
  );
}
