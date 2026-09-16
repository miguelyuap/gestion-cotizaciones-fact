'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, ChevronRight } from 'lucide-react';
import { DocumentWithDetails } from '@/lib/types';
import { getDocuments } from '@/lib/storage';
import { formatCOP, formatDateShort } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge, { BadgeStatus } from '@/components/ui/Badge';
import MetricCard from '@/components/ui/MetricCard';
import EmptyState from '@/components/ui/EmptyState';

export default function DocumentList() {
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Map internal document status to BadgeStatus
  const getBadgeStatus = (status: string, dueDate?: string): BadgeStatus => {
    if (status === 'paid') return 'paid';
    if (status === 'sent') {
      if (dueDate && new Date(dueDate) < new Date()) {
        return 'overdue';
      }
      return 'sent';
    }
    if (status === 'cancelled') return 'cancelled';
    return 'draft';
  };

  // Filtrado
  const filteredDocs = documents.filter((doc) => {
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
    
    const computedStatus = getBadgeStatus(doc.status, doc.due_date);
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue' && computedStatus !== 'overdue') return false;
      if (statusFilter === 'paid' && doc.status !== 'paid') return false;
      if (statusFilter === 'sent' && doc.status !== 'sent') return false;
      if (statusFilter === 'draft' && doc.status !== 'draft') return false;
      if (statusFilter === 'cancelled' && doc.status !== 'cancelled') return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const clientName = doc.clients?.name?.toLowerCase() || '';
      const docNum = doc.number.toLowerCase();
      const notes = doc.notes?.toLowerCase() || '';
      return clientName.includes(term) || docNum.includes(term) || notes.includes(term);
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

  const activeQuotationsCount = documents.filter(
    (d) => d.type === 'quotation' && (d.status === 'draft' || d.status === 'sent')
  ).length;

  const overdueCount = documents.filter(
    (d) => d.status === 'sent' && d.due_date && new Date(d.due_date) < new Date()
  ).length;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* 1. Encabezado de la página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Documentos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Cotizaciones y cuentas de cobro
          </p>
        </div>

        <Link href="/documents/new" className="w-full sm:w-auto">
          <Button icon={Plus} className="w-full sm:w-auto shadow-sm">
            Nuevo documento
          </Button>
        </Link>
      </div>

      {/* 2. Grid de 4 tarjetas de métricas (Responsive 1 -> 2 -> 4 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xs">
          <MetricCard
            label="Cobrado este mes"
            value={formatCOP(totalPaid)}
            variant="neutral"
          />
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xs">
          <MetricCard
            label="Por cobrar"
            value={formatCOP(totalPending)}
            variant="gold"
          />
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xs">
          <MetricCard
            label="Cotizaciones activas"
            value={activeQuotationsCount}
            variant="neutral"
          />
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xs">
          <MetricCard
            label="Vencidas"
            value={overdueCount}
            variant="rose"
          />
        </div>
      </div>

      {/* 3. Barra de Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar cliente o número"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-hidden text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-2xs transition-colors"
          />
        </div>

        {/* Filtro Estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-hidden shadow-2xs transition-colors"
        >
          <option value="all">Todos los estados</option>
          <option value="paid">Cobrado</option>
          <option value="sent">Enviado</option>
          <option value="overdue">Vencido</option>
          <option value="draft">Borrador</option>
          <option value="cancelled">Cancelado</option>
        </select>

        {/* Filtro Tipo */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3.5 py-2 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-hidden shadow-2xs transition-colors"
        >
          <option value="all">Todo tipo</option>
          <option value="bill">Cuenta de cobro</option>
          <option value="quotation">Cotización</option>
        </select>

      </div>

      {/* 4. Tabla de Documentos (Desktop) / Tarjetas Apiladas (Móvil) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-2xs overflow-hidden transition-colors">
        {filteredDocs.length > 0 ? (
          <>
            {/* Vista Escritorio / Tablet (Tabla) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800/80 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6 w-32">Número</th>
                    <th className="py-4 px-6">Cliente</th>
                    <th className="py-4 px-6 w-36">Fecha</th>
                    <th className="py-4 px-6 text-right w-40">Total</th>
                    <th className="py-4 px-6 text-center w-32">Estado</th>
                    <th className="py-4 px-6 text-right w-28">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                  {filteredDocs.map((doc) => {
                    const badgeStatus = getBadgeStatus(doc.status, doc.due_date);
                    const clientName = doc.clients?.name || 'Cliente general';
                    const firstItem = doc.document_items?.[0]?.description;
                    const clientSub = firstItem ? firstItem.split(' ')[0] + ' ' + (firstItem.split(' ')[1] || '') : '';
                    
                    return (
                      <tr
                        key={doc.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {doc.number}
                        </td>

                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {clientName}
                          </span>
                          {clientSub && (
                            <span className="text-slate-500 dark:text-slate-400 font-normal">
                              {' · '}
                              {clientSub}
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                          {formatDateShort(doc.date)}
                        </td>

                        <td className="py-4 px-6 text-right font-extrabold text-slate-900 dark:text-slate-100 whitespace-nowrap font-mono tabular-nums">
                          {formatCOP(doc.total_amount)}
                        </td>

                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <Badge status={badgeStatus} size="md" />
                        </td>

                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <Link href={`/documents/${doc.id}`}>
                            <Button variant="secondary" size="sm" className="px-3">
                              Ver <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Vista Móvil (Tarjetas Apiladas) - Mobile First ~375px */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.map((doc) => {
                const badgeStatus = getBadgeStatus(doc.status, doc.due_date);
                const clientName = doc.clients?.name || 'Cliente general';

                return (
                  <div key={doc.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                        {doc.number}
                      </span>
                      <Badge status={badgeStatus} size="sm" />
                    </div>

                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{clientName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDateShort(doc.date)}</p>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                        {formatCOP(doc.total_amount)}
                      </span>
                      <Link href={`/documents/${doc.id}`}>
                        <Button variant="secondary" size="sm">
                          Ver <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState
            title="Sin documentos"
            description="No encontramos ningún documento con los filtros de búsqueda aplicados."
            actionLabel="Nuevo documento"
            actionHref="/documents/new"
          />
        )}
      </div>

    </div>
  );
}
