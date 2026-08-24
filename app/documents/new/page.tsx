import DocumentForm from '@/components/DocumentForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewDocumentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <Link
          href="/"
          className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-sm transition"
          title="Volver al Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Crear Nuevo Documento
          </h1>
          <p className="text-xs text-slate-500">
            Diligencia los datos del cliente, los servicios contratados y el tipo de documento normativo.
          </p>
        </div>
      </div>

      <DocumentForm />
    </div>
  );
}
