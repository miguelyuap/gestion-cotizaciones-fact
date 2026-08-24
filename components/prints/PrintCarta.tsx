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
    <div className="bg-white text-slate-900 p-8 md:p-12 max-w-4xl mx-auto shadow-lg print:shadow-none print:max-w-none print:p-0 print-area rounded-lg font-sans">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-200 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
            {profile.razon_social}
          </h1>
          <p className="text-sm text-slate-600 font-medium mt-1">
            {profile.document_type}: {profile.document_number}
          </p>
          <p className="text-xs text-slate-500 mt-1">{profile.address} • {profile.city}</p>
          <p className="text-xs text-slate-500">Tel: {profile.phone} | Email: {profile.email}</p>
        </div>

        <div className="mt-4 md:mt-0 text-left md:text-right bg-slate-50 p-4 rounded-lg border border-slate-200 min-w-[220px]">
          <h2 className="text-xs font-bold text-blue-700 tracking-wider uppercase">
            {isBill ? 'CUENTA DE COBRO' : 'COTIZACIÓN'}
          </h2>
          <p className="text-2xl font-extrabold text-slate-900 mt-0.5">N° {doc.number}</p>
          <div className="mt-2 text-xs text-slate-600 space-y-0.5">
            <p><span className="font-semibold">Fecha:</span> {formatDate(doc.date)}</p>
            {doc.due_date && (
              <p><span className="font-semibold">Vencimiento:</span> {formatDate(doc.due_date)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Información del Cliente */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
          {isBill ? 'DEBE A:' : 'COTIZADO A:'}
        </h3>
        {doc.clients ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-800">
            <div>
              <p className="font-bold text-slate-900">{doc.clients.name}</p>
              <p className="text-xs text-slate-600">
                {doc.clients.document_type || 'NIT/C.C.'}: {doc.clients.document_number}
              </p>
            </div>
            <div className="text-xs text-slate-600 md:text-right">
              {doc.clients.address && <p>{doc.clients.address}</p>}
              {doc.clients.city && <p>{doc.clients.city}</p>}
              {doc.clients.email && <p>{doc.clients.email}</p>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">Cliente no especificado</p>
        )}
      </div>

      {/* Tabla de Items */}
      <div className="mb-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 rounded-tl-md">Cant.</th>
              <th className="py-3 px-4">Descripción del Servicio / Producto</th>
              <th className="py-3 px-4 text-right">V. Unitario</th>
              <th className="py-3 px-4 text-right rounded-tr-md">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-800">
            {doc.document_items && doc.document_items.length > 0 ? (
              doc.document_items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="py-3 px-4 font-semibold text-slate-700 align-top">{item.quantity}</td>
                  <td className="py-3 px-4 align-top">
                    <p className="font-medium whitespace-pre-wrap">{item.description}</p>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap align-top">{formatCOP(item.unit_price)}</td>
                  <td className="py-3 px-4 text-right font-semibold whitespace-nowrap align-top">{formatCOP(item.total_price)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-4 px-4 text-center text-slate-500 text-sm italic">
                  No hay ítems registrados en este documento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen de Totales */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
        <div className="w-full md:w-1/2">
          {doc.notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-900">
              <p className="font-bold mb-1">Notas / Observaciones:</p>
              <p className="whitespace-pre-wrap">{doc.notes}</p>
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-800">{formatCOP(doc.subtotal)}</span>
          </div>

          {doc.retention_applied && doc.retention_amount > 0 && (
            <div className="flex justify-between text-amber-700 text-xs">
              <span>(-) ReteFuente ({doc.retention_rate}%):</span>
              <span className="font-semibold">-{formatCOP(doc.retention_amount)}</span>
            </div>
          )}

          <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-slate-900">
            <span className="text-base font-extrabold">
              {isBill ? 'VALOR NETO A PAGAR:' : 'TOTAL COTIZADO:'}
            </span>
            <span className="text-xl font-extrabold text-blue-700">
              {formatCOP(doc.total_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Información Bancaria (Obligatoria para Cuentas de Cobro en Colombia) */}
      {isBill && (
        <div className="border border-emerald-300 bg-emerald-50/60 rounded-lg p-4 mb-6">
          <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider mb-1">
            INFORMACIÓN PARA CONSIGNACIÓN / TRANSFERENCIA BANCARIA
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-emerald-950 font-medium">
            <p><span className="font-bold">Banco:</span> {profile.bank_name}</p>
            <p><span className="font-bold">Tipo de Cuenta:</span> {profile.account_type}</p>
            <p><span className="font-bold">N° de Cuenta:</span> {profile.account_number}</p>
          </div>
          <p className="text-[11px] text-emerald-800 mt-1">
            <span className="font-bold">Titular:</span> {profile.razon_social} ({profile.document_type} {profile.document_number})
          </p>
        </div>
      )}

      {/* Declaración Juramentada y Texto Legal Colombiano (Art. 383 E.T. / Decreto 522 de 2003) */}
      {isBill && (
        <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-3 leading-relaxed">
          <p className="font-semibold text-slate-600 mb-0.5 uppercase">Declaración Juramentada:</p>
          <p>{profile.legal_text}</p>
        </div>
      )}

      {/* Firma Digital */}
      <div className="mt-12 pt-6 border-t border-slate-300 flex justify-between items-end">
        <div className="text-xs text-slate-500">
          <p>Generado por <span className="font-bold text-slate-700">GST Cotizaciones & Cobros</span></p>
        </div>
        <div className="text-center min-w-[220px]">
          <div className="border-b border-slate-400 mb-1 min-h-[50px] flex items-end justify-center pb-1">
            {profile.signature_url ? (
              /* eslint-disable-next-html-element-suppress */
              <img
                src={profile.signature_url}
                alt="Firma Digital Emisor"
                className="max-h-16 max-w-[200px] object-contain"
              />
            ) : (
              <span className="text-xs text-slate-400 font-serif italic mb-1">[ Firma Digital / Electrónica ]</span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-800">{profile.razon_social}</p>
          <p className="text-[10px] text-slate-500">{profile.document_type}: {profile.document_number}</p>
        </div>
      </div>
    </div>
  );
}
