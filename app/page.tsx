import DocumentList from '@/components/DocumentList';
import Link from 'next/link';
import { PlusCircle, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-8">
      
      {/* Banner de Bienvenida */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Normativa Colombiana (Art. 383 E.T. / Dec. 522)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Gestión de Cotizaciones y Cuentas de Cobro
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Crea, gestiona e imprime documentos oficiales en formato **Carta PDF** e **Impresoras Térmicas POS (58mm / 80mm)**.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/documents/new"
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-md transition"
            >
              <PlusCircle className="w-5 h-5" />
              Crear Documento
            </Link>
          </div>
        </div>
      </div>

      {/* Historial de Documentos y Métricas */}
      <DocumentList />

    </div>
  );
}
