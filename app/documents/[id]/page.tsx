'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Printer, 
  FileText, 
  Receipt, 
  AlertCircle
} from 'lucide-react';
import { DocumentWithDetails, PrintMode, Profile } from '@/lib/types';
import { getDocumentById, getProfile, updateDocumentStatus } from '@/lib/storage';
import PrintCarta from '@/components/prints/PrintCarta';
import PrintTicket from '@/components/prints/PrintTicket';

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [doc, setDoc] = useState<DocumentWithDetails | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState<PrintMode>('carta');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [d, p] = await Promise.all([
        getDocumentById(resolvedParams.id),
        getProfile()
      ]);
      setDoc(d);
      setProfile(p);
      setLoading(false);
    }
    load();
  }, [resolvedParams.id]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleStatusChange = async (newStatus: DocumentWithDetails['status']) => {
    if (!doc) return;
    await updateDocumentStatus(doc.id, newStatus);
    setDoc({ ...doc, status: newStatus });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Cargando documento...
      </div>
    );
  }

  if (!doc || !profile) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-8">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Documento no encontrado</h2>
        <p className="text-sm text-slate-500">El documento solicitado no existe o fue eliminado.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  const isBill = doc.type === 'bill';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Barra Superior de Acciones y Modos (Se oculta al imprimir con class no-print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
            title="Volver al Historial"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {isBill ? 'Cuenta de Cobro' : 'Cotización'} N° {doc.number}
            </h1>
            <p className="text-xs text-slate-500">
              Cliente: <span className="font-semibold text-slate-700">{doc.clients?.name}</span>
            </p>
          </div>
        </div>

        {/* Control Switch de Vista Carta vs Ticket POS */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setPrintMode('carta')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition ${
              printMode === 'carta'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Vista Carta (PDF)
          </button>
          <button
            onClick={() => setPrintMode('ticket')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition ${
              printMode === 'ticket'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Ticket POS (58/80mm)
          </button>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          
          <select
            value={doc.status}
            onChange={(e) => handleStatusChange(e.target.value as DocumentWithDetails['status'])}
            className={`px-3 py-2 text-xs font-bold rounded-lg border cursor-pointer ${
              doc.status === 'paid'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : doc.status === 'sent'
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : doc.status === 'cancelled'
                ? 'bg-red-50 text-red-700 border-red-300'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="paid">Pagada</option>
            <option value="cancelled">Cancelada</option>
          </select>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </button>
        </div>

      </div>

      {/* Visor del Documento según Modo Seleccionado */}
      <div className="py-2">
        {printMode === 'carta' ? (
          <PrintCarta document={doc} profile={profile} />
        ) : (
          <PrintTicket document={doc} profile={profile} />
        )}
      </div>

    </div>
  );
}
