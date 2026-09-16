/* eslint-disable @next/next/no-img-element */
import { DocumentWithDetails, Profile } from '@/lib/types';
import { formatCOP, formatDate } from '@/lib/utils';

interface PrintCartaProps {
  document: DocumentWithDetails;
  profile: Profile;
}

export default function PrintCarta({ document: doc, profile }: PrintCartaProps) {
  const isBill = doc.type === 'bill';

  return (
    <div className="bg-white text-slate-900 p-6 sm:p-10 md:p-12 max-w-4xl mx-auto shadow-lg print:shadow-none print:max-w-none print:p-0 print-area rounded-xl font-sans border border-slate-200 print:border-0">
      
      {/* Cabecera Principal */}
      <div className="flex flex-row justify-between items-start border-b-2 border-slate-900 pb-4 print:pb-2 mb-4 print:mb-2 avoid-break">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
            {profile.razon_social}
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 font-bold mt-0.5">
            {profile.document_type}: {profile.document_number}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">{profile.address} • {profile.city}</p>
          <p className="text-xs text-slate-600">Tel: {profile.phone} | Email: {profile.email}</p>
        </div>

        <div className="text-right bg-slate-900 text-white p-3.5 print:p-2.5 rounded-xl shadow-sm min-w-[240px]">
          <h2 className="text-[11px] font-black tracking-widest uppercase text-blue-300">
            {isBill ? 'CUENTA DE COBRO' : 'COTIZACIÓN'}
          </h2>
          <p className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5 text-white">N° {doc.number}</p>
          {isBill && profile.document_subtitle && (
            <p className="text-[9px] text-slate-300 leading-tight mt-1 border-t border-slate-700 pt-1 font-medium">
              {profile.document_subtitle}
            </p>
          )}
          <div className="mt-1.5 text-xs text-slate-300 space-y-0.5 border-t border-slate-700 pt-1.5">
            <p><span className="font-semibold text-slate-400">Fecha de Emisión:</span> {formatDate(doc.date)}</p>
            {doc.due_date && (
              <p><span className="font-semibold text-slate-400">Vencimiento:</span> {formatDate(doc.due_date)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Relación de Cliente y DEBE A (Normatividad Colombia) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 print:p-2.5 mb-4 print:mb-2 grid grid-cols-2 gap-4 print:gap-2 avoid-break">
        
        {/* 1. Datos del Cliente / Deudor */}
        <div>
          <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block no-print"></span>
            {isBill ? 'CLIENTE:' : 'COTIZADO A / CLIENTE:'}
          </h3>
          {doc.clients ? (
            <div className="text-xs sm:text-sm text-slate-800 space-y-0.5">
              <p className="font-bold text-slate-900 text-sm sm:text-base">{doc.clients.name}</p>
              <p className="text-xs font-semibold text-slate-700">
                {doc.clients.document_type || 'NIT/C.C.'}: {doc.clients.document_number}
              </p>
              {doc.clients.address && <p className="text-xs text-slate-600">{doc.clients.address} {doc.clients.city ? `• ${doc.clients.city}` : ''}</p>}
              {doc.clients.email && <p className="text-xs text-slate-600">{doc.clients.email}</p>}
              {doc.clients.phone && <p className="text-xs text-slate-600">Tel: {doc.clients.phone}</p>}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">Cliente no especificado</p>
          )}
        </div>

        {/* 2. DEBE A (Emisor / Contratista) */}
        <div className="border-l border-slate-200 pl-4">
          <h3 className="text-[11px] font-black uppercase text-blue-700 tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block no-print"></span>
            {isBill ? 'DEBE A:' : 'EMISOR / PROVEEDOR:'}
          </h3>
          <div className="text-xs sm:text-sm text-slate-800 space-y-0.5">
            <p className="font-bold text-slate-900 text-sm sm:text-base">{profile.razon_social}</p>
            <p className="text-xs font-semibold text-slate-700">
              {profile.document_type}: {profile.document_number}
            </p>
            {profile.address && <p className="text-xs text-slate-600">{profile.address} • {profile.city}</p>}
            {profile.phone && <p className="text-xs text-slate-600">Tel: {profile.phone} | Email: {profile.email}</p>}
          </div>
        </div>

      </div>

      {/* Tabla de Items */}
      <div className="mb-4 print:mb-2 overflow-x-auto rounded-lg border border-slate-200 avoid-break">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
              <th className="py-2 px-3">Cant.</th>
              <th className="py-2 px-3">Descripción del Servicio / Producto</th>
              <th className="py-2 px-3 text-right">V. Unitario</th>
              <th className="py-2 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs sm:text-sm text-slate-800">
            {doc.document_items && doc.document_items.length > 0 ? (
              doc.document_items.map((item, index) => (
                <tr key={index} className={`avoid-break ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="py-2 px-3 font-bold text-slate-800 align-top w-12 text-center">{item.quantity}</td>
                  <td className="py-2 px-3 align-top">
                    <p className="font-medium whitespace-pre-wrap leading-relaxed">{item.description}</p>
                  </td>
                  <td className="py-2 px-3 text-right whitespace-nowrap align-top font-medium text-slate-700">{formatCOP(item.unit_price)}</td>
                  <td className="py-2 px-3 text-right font-bold whitespace-nowrap align-top text-slate-900">{formatCOP(item.total_price)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-3 px-3 text-center text-slate-500 text-xs italic">
                  No hay ítems registrados en este documento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen de Totales */}
      <div className="flex flex-row justify-between items-start gap-4 mb-4 print:mb-2 avoid-break">
        {doc.notes ? (
          <div className="w-1/2">
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-2.5 text-xs text-blue-950 space-y-0.5">
              <p className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">Notas / Observaciones:</p>
              <p className="whitespace-pre-wrap leading-relaxed">{doc.notes}</p>
            </div>
          </div>
        ) : <div className="hidden print:block" />}

        <div className="w-1/2 ml-auto bg-slate-50 p-3 print:p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-1 totals-box avoid-break">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-900">{formatCOP(doc.subtotal)}</span>
          </div>

          {doc.discount_rate ? doc.discount_rate > 0 && (
            <div className="flex justify-between text-emerald-700 text-xs font-medium">
              <span>(-) Descuento ({doc.discount_rate}%):</span>
              <span className="font-bold">-{formatCOP(doc.discount_amount || 0)}</span>
            </div>
          ) : null}

          {doc.tax_rate ? doc.tax_rate > 0 && (
            <div className="flex justify-between text-blue-700 text-xs font-medium">
              <span>(+) IVA ({doc.tax_rate}%):</span>
              <span className="font-bold">+{formatCOP(doc.tax_amount || 0)}</span>
            </div>
          ) : null}

          {doc.retention_applied && doc.retention_amount > 0 && (
            <div className="flex justify-between text-amber-700 text-xs font-medium">
              <span>(-) ReteFuente ({doc.retention_rate}%):</span>
              <span className="font-bold">-{formatCOP(doc.retention_amount)}</span>
            </div>
          )}

          <div className="border-t-2 border-slate-900 pt-1 flex justify-between items-center text-slate-900">
            <span className="text-xs sm:text-sm font-black tracking-tight uppercase">
              {isBill ? 'VALOR NETO A PAGAR:' : 'TOTAL COTIZADO:'}
            </span>
            <span className="text-base sm:text-lg font-black text-blue-700">
              {formatCOP(doc.total_amount)}
            </span>
          </div>

          {doc.amount_in_words && (
            <div className="pt-1 border-t border-slate-200 text-[10px] text-slate-600 italic">
              <span className="font-bold text-slate-800 uppercase">Son:</span> {doc.amount_in_words}
            </div>
          )}
        </div>
      </div>

      {/* Información Bancaria (Obligatoria para Cuentas de Cobro en Colombia) */}
      {isBill && (
        <div className="border-2 border-emerald-400 bg-emerald-50/60 rounded-xl p-3 print:p-2.5 mb-3 print:mb-2 shadow-sm bank-box avoid-break">
          <h4 className="text-[10px] sm:text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-1 border-b border-emerald-200 pb-0.5">
            INFORMACIÓN PARA CONSIGNACIÓN / TRANSFERENCIA BANCARIA
          </h4>
          <div className="grid grid-cols-3 gap-1 text-xs text-emerald-950 font-medium">
            <p><span className="font-bold text-emerald-900">Banco:</span> {profile.bank_name}</p>
            <p><span className="font-bold text-emerald-900">Tipo de Cuenta:</span> {profile.account_type}</p>
            <p><span className="font-bold text-emerald-900">N° de Cuenta:</span> {profile.account_number}</p>
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-900 mt-1 font-semibold">
            Titular: {profile.account_holder_name || profile.razon_social} ({profile.account_holder_doc || `${profile.document_type} ${profile.document_number}`})
          </p>
        </div>
      )}

      {/* Declaración Juramentada y Texto Legal Colombiano (Art. 383 E.T. / Decreto 522 de 2003) */}
      {isBill && (
        <div className="text-[9px] sm:text-[10px] text-slate-600 border-t border-slate-200 pt-2 print:pt-1.5 leading-relaxed legal-box avoid-break">
          <p className="font-bold text-slate-800 mb-0.5 uppercase">Declaración Juramentada (Art. 383 E.T.):</p>
          <p>{profile.legal_text}</p>
        </div>
      )}

      {/* Firma Digital */}
      <div className="mt-4 print:mt-2 pt-3 print:pt-1.5 border-t border-slate-300 flex justify-between items-end signature-box avoid-break">
        <div className="text-xs text-slate-500">
          <p>Generado por <span className="font-bold text-slate-800">GST Cotizaciones & Cobros</span></p>
        </div>
        <div className="text-center min-w-[200px]">
          <div className="border-b border-slate-400 mb-1 min-h-[40px] flex items-end justify-center pb-0.5">
            {profile.signature_url ? (
              <img
                src={profile.signature_url}
                alt="Firma Digital Emisor"
                className="max-h-12 max-w-[170px] object-contain"
              />
            ) : (
              <span className="text-xs text-slate-400 font-serif italic mb-1">[ Firma Digital / Electrónica ]</span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-900 uppercase">{profile.razon_social}</p>
          <p className="text-[10px] text-slate-600 font-semibold">{profile.document_type}: {profile.document_number}</p>
        </div>
      </div>

    </div>
  );
}
