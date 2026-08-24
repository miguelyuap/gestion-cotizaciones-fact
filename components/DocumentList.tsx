'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  FileText, 
  Eye, 
  Clock, 
  DollarSign, 
  Filter,
  Plus
} from 'lucide-react';
import { DocumentWithDetails } from '@/lib/types';
import { getDocuments, updateDocumentStatus } from '@/lib/storage';
import { formatCOP, formatDate } from '@/lib/utils';

export default function DocumentList() {
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const refreshDocuments = async () => {
    const docs = await getDocuments();
    setDocuments(docs);
  };

  useEffect(() => {
    let mounted = true;
    getDocuments().then((docs) => {
      if (mounted) {
        setDocuments(docs);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleStatusChange = async (id: string, newStatus: DocumentWithDetails['status']) => {
    await updateDocumentStatus(id, newStatus);
    refreshDocuments();
  };

  // Filtrado
  const filteredDocs = documents.filter((doc) => {
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const clientName = doc.clients?.name?.toLowerCase() || '';
      const docNum = doc.number.toLowerCase();
      return clientName.includes(term) || docNum.includes(term);
    }
    return true;
  });

  // Métricas
  const totalPaid = documents
    .filter((d) => d.type === 'bill' && d.status === 'paid')
    .reduce((sum, d) => sum + Number(d.total_amount), 0);

  const totalPending = documents
    .filter((d) => d.type === 'bill' && (d.status === 'sent' || d.status === 'draft'))
    .reduce((sum, d) => sum + Number(d.total_amount), 0);

  const activeQuotations = documents
    .filter((d) => d.type === 'quotation')
    .reduce((sum, d) => sum + Number(d.total_amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Cargando historial de documentos...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Tarjetas de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Cobrado (Pagado)</p>
            <p className="text-xl font-black text-slate-900">{formatCOP(totalPaid)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Cuentas por Cobrar (Pendientes)</p>
            <p className="text-xl font-black text-slate-900">{formatCOP(totalPending)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Cotizaciones Emitidas</p>
            <p className="text-xl font-black text-slate-900">{formatCOP(activeQuotations)}</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente o número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-2 font-medium">
            <Filter className="w-4 h-4 text-slate-400" />
            Filtros:
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-700"
          >
            <option value="all">Todos los tipos</option>
            <option value="bill">Cuentas de Cobro</option>
            <option value="quotation">Cotizaciones</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-700"
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="paid">Pagada</option>
            <option value="cancelled">Cancelada</option>
          </select>

          <Link
            href="/documents/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition ml-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </Link>
        </div>

      </div>

      {/* Listado de Documentos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredDocs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b border-slate-200">
                  <th className="py-3 px-4">Número</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4 text-right">Total Netos</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm text-slate-800">
                {filteredDocs.map((doc) => {
                  const isBill = doc.type === 'bill';
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50 transition">
                      
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {doc.number}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isBill ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isBill ? 'Cuenta de Cobro' : 'Cotización'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {doc.clients?.name || 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {formatDate(doc.date)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {formatCOP(doc.total_amount)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={doc.status}
                          onChange={(e) => handleStatusChange(doc.id, e.target.value as DocumentWithDetails['status'])}
                          className={`px-2 py-1 text-xs font-bold rounded-lg border cursor-pointer ${
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
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          Ver / Imprimir
                        </Link>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-base font-semibold">No se encontraron documentos con los filtros aplicados.</p>
            <Link
              href="/documents/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Crear primer documento
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
