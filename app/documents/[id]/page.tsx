'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Share2, 
  AlertCircle,
  CheckCircle2,
  Send,
  FileText,
  Mail,
  Phone
} from 'lucide-react';
import { DocumentWithDetails, PrintMode, Profile } from '@/lib/types';
import { getDocumentById, getProfile, updateDocumentStatus } from '@/lib/storage';
import { formatCOP, formatDateShort } from '@/lib/utils';
import { exportDocumentsToCSV, generateWhatsAppShareLink, generateEmailShareLink } from '@/lib/services/exportService';
import { generateCuentaDeCobroDocx, downloadDocxBlob } from '@/lib/services/docxExportService';
import Button from '@/components/ui/Button';
import Badge, { BadgeStatus } from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import PrintCarta from '@/components/prints/PrintCarta';
import PrintTicket from '@/components/prints/PrintTicket';

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [doc, setDoc] = useState<DocumentWithDetails | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState<PrintMode>('carta');
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [generatingDocx, setGeneratingDocx] = useState(false);

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

  const handleExportExcel = () => {
    if (doc) {
      exportDocumentsToCSV([doc], `${doc.type}-${doc.number}.csv`);
    }
  };

  const handleExportDocx = async () => {
    if (!doc || !profile) return;
    setGeneratingDocx(true);
    try {
      const blob = await generateCuentaDeCobroDocx(doc, profile);
      const clientNameClean = (doc.clients?.name || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
      downloadDocxBlob(blob, `Cuenta_de_Cobro_${doc.number}_${clientNameClean}.docx`);
    } catch (err) {
      console.error('Error generando documento Word:', err);
      alert('Error al generar el archivo Word (.docx).');
    } finally {
      setGeneratingDocx(false);
    }
  };

  const handleStatusChange = async (newStatus: DocumentWithDetails['status']) => {
    if (!doc) return;
    await updateDocumentStatus(doc.id, newStatus);
    setDoc({ ...doc, status: newStatus });
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3 max-w-xl mx-auto">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white mx-auto"></div>
        <p className="text-sm font-semibold">Cargando detalle del documento...</p>
      </div>
    );
  }

  if (!doc || !profile) {
    return (
      <Card className="max-w-lg mx-auto text-center space-y-4 my-12">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Documento no encontrado</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">El documento solicitado no existe o fue eliminado.</p>
        <Link href="/">
          <Button icon={ArrowLeft} variant="secondary">
            Volver al Dashboard
          </Button>
        </Link>
      </Card>
    );
  }

  const clientName = doc.clients?.name || 'Cliente general / Ocasional';
  const clientDoc = doc.clients ? `${doc.clients.document_type || 'CC'} ${doc.clients.document_number}` : 'N/A';
  const clientEmail = doc.clients?.email || 'Sin correo registrado';
  const clientPhone = doc.clients?.phone || 'Sin teléfono registrado';
  
  // Extraer iniciales del cliente
  const initials = clientName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  // Mapeo del estado del badge
  const badgeStatus: BadgeStatus = 
    doc.status === 'paid' ? 'paid' : 
    doc.status === 'sent' ? 'sent' : 
    doc.status === 'cancelled' ? 'cancelled' : 'draft';

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* 1. Encabezado de la página (Número, Badge, Cliente & Acciones) - Oculto en impresión */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        
        {/* Lado Izquierdo: Número, Badge y Cliente */}
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/"
              className="p-2.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition shadow-2xs"
              title="Volver al Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {doc.number}
            </h1>
            <Badge status={badgeStatus} size="lg" />
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 pl-12">
            {clientName}
          </p>
        </div>

        {/* Lado Derecho: Acciones siempre visibles (WhatsApp, Imprimir, CSV) */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          
          {/* Cambiar estado */}
          {doc.status !== 'paid' && (
            <Button
              variant="outline"
              size="md"
              onClick={() => handleStatusChange('paid')}
              className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 font-bold"
            >
              Marcar Cobrado
            </Button>
          )}

          {/* Botón Compartir (WhatsApp / Correo) */}
          <div className="relative flex-1 md:flex-none">
            <Button
              variant="outline"
              size="md"
              icon={Share2}
              onClick={() => setShareMenuOpen(!shareMenuOpen)}
              className="w-full md:w-auto text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold"
            >
              Compartir
            </Button>

            {shareMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5 space-y-1">
                <a
                  href={generateWhatsAppShareLink(doc)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    setShareMenuOpen(false);
                    if (doc.status === 'draft') handleStatusChange('sent');
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg transition"
                >
                  <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Enviar por WhatsApp</span>
                </a>

                <a
                  href={generateEmailShareLink(doc, profile)}
                  onClick={() => {
                    setShareMenuOpen(false);
                    if (doc.status === 'draft') handleStatusChange('sent');
                  }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-400 rounded-lg transition"
                >
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Enviar por Correo</span>
                </a>
              </div>
            )}
          </div>

          {/* Botón Imprimir */}
          <Button
            variant="primary"
            size="md"
            icon={Printer}
            onClick={handlePrint}
            className="flex-1 md:flex-none shadow-xs font-bold"
          >
            Imprimir PDF
          </Button>

          {/* Botón Word (.docx) */}
          <Button
            variant="outline"
            size="md"
            icon={FileText}
            disabled={generatingDocx}
            onClick={handleExportDocx}
            className="flex-1 md:flex-none font-bold text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60"
          >
            {generatingDocx ? 'Generando...' : 'Descargar Word (.docx)'}
          </Button>

          {/* Botón CSV */}
          <Button
            variant="outline"
            size="md"
            icon={Download}
            onClick={handleExportExcel}
            className="flex-1 md:flex-none font-bold"
          >
            CSV
          </Button>

        </div>

      </div>

      {/* 2. Layout interactivo web de dos columnas - Oculto en impresión */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start no-print">
        
        {/* COLUMNA IZQUIERDA: Ítems, Desglose Tributario y Total */}
        <div className="md:col-span-7 space-y-6">
          <Card padding="lg" className="space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Ítems
            </h2>

            {/* Tabla de Ítems */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-0">Descripción</th>
                    <th className="py-2.5 px-4 text-center w-16">Cant.</th>
                    <th className="py-2.5 px-0 text-right w-32">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {doc.document_items && doc.document_items.length > 0 ? (
                    doc.document_items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-3 px-0 font-medium pr-4 text-slate-800 dark:text-slate-200">
                          {item.description}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-slate-100">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-0 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {formatCOP(item.total_price)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400 italic">
                        Sin ítems registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Desglose Tributario y Totales */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Subtotal</span>
                <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                  {formatCOP(doc.subtotal)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Retención en la fuente</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {doc.retention_applied && doc.retention_amount > 0
                    ? `-${formatCOP(doc.retention_amount)} (${doc.retention_rate}%)`
                    : 'No aplica'}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-600 dark:text-slate-400">IVA</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {doc.tax_rate && doc.tax_rate > 0
                    ? `+${formatCOP(doc.tax_amount || 0)} (${doc.tax_rate}%)`
                    : 'No responsable (Art. 383 E.T.)'}
                </span>
              </div>

              {/* Total destacado */}
              <div className="pt-4 border-t-2 border-slate-900 dark:border-white flex justify-between items-baseline">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Total
                </span>
                <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono tabular-nums">
                  {formatCOP(doc.total_amount)}
                </span>
              </div>

              {/* Total en Letras COP en cursiva secundaria */}
              {doc.amount_in_words && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic pt-1 font-medium">
                  {doc.amount_in_words}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* COLUMNA DERECHA: Datos del Cliente + Historial de actividad */}
        <div className="md:col-span-5 space-y-6">
          
          {/* Card Cliente */}
          <Card padding="md" className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Cliente
            </h2>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow-xs">
                {initials}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {clientName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {clientDoc}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Correo
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-200 truncate max-w-[180px]">
                  {clientEmail}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Teléfono
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">
                  {clientPhone}
                </span>
              </div>
            </div>
          </Card>

          {/* Card Historial de Actividad */}
          <Card padding="md" className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Historial
            </h2>

            <div className="space-y-3.5 text-xs">
              {doc.status === 'paid' && (
                <div className="flex items-start gap-2.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">Pago registrado</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">30 ago 2026</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5 text-blue-600 dark:text-blue-400 font-medium">
                <Send className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Enviado por WhatsApp</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatDateShort(doc.date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-slate-500 dark:text-slate-400 font-medium">
                <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Documento creado</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatDateShort(doc.date)}</p>
                </div>
              </div>
            </div>
          </Card>

        </div>

      </div>

      {/* 3. Visor de Impresión Oficial (Carta / POS) - Este es el ÚNICO objetivo que se imprime en PDF/Papel */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4 print:pt-0 print:border-0">
        
        <div className="flex justify-between items-center no-print">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Vista de Impresión Oficial (Carta / POS)
          </h3>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setPrintMode('carta')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                printMode === 'carta'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Formato Carta PDF
            </button>
            <button
              onClick={() => setPrintMode('ticket')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                printMode === 'ticket'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ticket POS
            </button>
          </div>
        </div>

        <div className="bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto print:bg-white print:p-0 print:border-0 shadow-inner">
          {printMode === 'carta' ? (
            <PrintCarta document={doc} profile={profile} />
          ) : (
            <PrintTicket document={doc} profile={profile} />
          )}
        </div>
      </div>

    </div>
  );
}
