'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { Client, DocumentItem, DocumentType } from '@/lib/types';
import { getClients, createClient, saveDocument, getProfile, getDocuments } from '@/lib/storage';
import { formatCOP, generateNextNumber } from '@/lib/utils';
import { calculateDocumentSummary } from '@/lib/services/taxCalculator';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function DocumentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  // Toast / Feedback message
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Campos del Formulario
  const [type, setType] = useState<DocumentType>('bill');
  const [number, setNumber] = useState('');
  const [date] = useState(new Date().toISOString().split('T')[0]);

  // Selección y datos del cliente
  const [selectedClientOption, setSelectedClientOption] = useState<string>('new');
  const [clientNameInput, setClientNameInput] = useState('');
  const [clientDocNumInput, setClientDocNumInput] = useState('');
  const [clientDocTypeInput, setClientDocTypeInput] = useState('CC');

  // Impuestos y Descuentos
  const [discountRate] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [retentionApplied, setRetentionApplied] = useState(false);
  const [retentionRate, setRetentionRate] = useState<number>(2.5);

  // Tabla Dinámica de Ítems
  const [items, setItems] = useState<DocumentItem[]>([
    { description: 'Diseño de sitio web corporativo', quantity: 1, unit_price: 1100000, total_price: 1100000 },
    { description: '', quantity: 1, unit_price: 0, total_price: 0 },
  ]);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([getClients(), getProfile(), getDocuments()]).then(([cls, , existingDocs]) => {
      if (!mounted) return;
      setClients(cls);
      if (cls.length > 0) {
        setSelectedClientOption(cls[0].id);
        setClientNameInput(cls[0].name);
        setClientDocNumInput(cls[0].document_number);
        setClientDocTypeInput(cls[0].document_type || 'CC');
      } else {
        setSelectedClientOption('new');
      }

      const typeDocs = existingDocs.filter((d) => d.type === 'bill');
      setNumber(generateNextNumber('bill', typeDocs.length));
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleClientSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedClientOption(val);
    if (val === 'new') {
      setClientNameInput('');
      setClientDocNumInput('');
      setClientDocTypeInput('CC');
    } else {
      const selected = clients.find((c) => c.id === val);
      if (selected) {
        setClientNameInput(selected.name);
        setClientDocNumInput(selected.document_number);
        setClientDocTypeInput(selected.document_type || 'CC');
      }
    }
  };

  const handleTypeChange = async (newType: DocumentType) => {
    setType(newType);
    const existingDocs = await getDocuments();
    const typeDocs = existingDocs.filter((d) => d.type === newType);
    setNumber(generateNextNumber(newType, typeDocs.length));
  };

  const handleItemChange = (index: number, field: keyof DocumentItem, value: string | number) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      const q = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity)) || 0;
      const p = typeof item.unit_price === 'number' ? item.unit_price : parseFloat(String(item.unit_price)) || 0;
      item.total_price = Math.round((q * p + Number.EPSILON) * 100) / 100;
    }

    updatedItems[index] = item;
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Cálculos en tiempo real mediante taxCalculator.ts
  const validItems = items.filter((it) => it.description.trim() !== '' || it.unit_price > 0);
  const summary = calculateDocumentSummary({
    items: validItems.length > 0 ? validItems : items,
    discountRate,
    taxRate,
    retentionApplied,
    retentionRate,
  });

  const executeSave = useCallback(async () => {
    if (!clientNameInput.trim()) {
      showToast('Por favor ingresa el nombre del cliente.');
      return;
    }

    const firstValidItem = items.find((i) => i.description.trim() !== '' && i.unit_price > 0);
    if (!firstValidItem) {
      showToast('Por favor ingresa al menos un ítem con descripción y precio.');
      return;
    }

    setSaving(true);
    try {
      let selectedClientId: string;

      if (selectedClientOption && selectedClientOption !== 'new') {
        selectedClientId = selectedClientOption;
      } else {
        const matched = clients.find(
          (c) => c.name.toLowerCase() === clientNameInput.trim().toLowerCase()
        );

        if (matched) {
          selectedClientId = matched.id;
        } else {
          const newClient = await createClient({
            name: clientNameInput.trim(),
            document_type: clientDocTypeInput || 'CC',
            document_number: clientDocNumInput.trim() || '0',
          });
          selectedClientId = newClient.id;
        }
      }

      const saved = await saveDocument({
        client_id: selectedClientId,
        type,
        number,
        date,
        discount_rate: discountRate,
        discount_amount: summary.discountAmount,
        tax_rate: taxRate,
        tax_amount: summary.taxAmount,
        retention_applied: retentionApplied,
        retention_rate: retentionRate,
        retention_amount: summary.retentionAmount,
        subtotal: summary.subtotal,
        total_amount: summary.totalAmount,
        amount_in_words: summary.amountInWords,
        status: 'draft',
        notes: '',
        document_items: items.filter((i) => i.description.trim() !== ''),
      });

      router.push(`/documents/${saved.id}`);
    } catch (err) {
      console.error(err);
      showToast('Error al guardar el documento. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  }, [
    clientNameInput,
    items,
    clients,
    selectedClientOption,
    clientDocTypeInput,
    clientDocNumInput,
    type,
    number,
    date,
    discountRate,
    summary,
    taxRate,
    retentionApplied,
    retentionRate,
    router,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSave();
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white mx-auto"></div>
        <p className="text-sm font-semibold">Cargando formulario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24 md:pb-12">
      
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-xl shadow-xl bg-slate-900 text-white border border-slate-700 text-xs sm:text-sm font-bold animate-bounce">
          {toast.message}
        </div>
      )}

      {/* 1. Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Nuevo documento
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Se guarda automáticamente mientras escribes
          </p>
        </div>

        {/* Toggle Cotización / Cuenta de cobro */}
        <div className="flex bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleTypeChange('quotation')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              type === 'quotation'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cotización
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('bill')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
              type === 'bill'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cuenta de cobro
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 2. Layout de dos columnas (Stacks vertically en pantallas < 768px) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA (~7/12 cols): Cliente, Ítems, Ajustes Tributarios */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Card Cliente */}
            <Card padding="md" className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Cliente
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Seleccionar Cliente Registrado
                </label>
                <select
                  value={selectedClientOption}
                  onChange={handleClientSelectChange}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-hidden"
                >
                  <option value="new">➕ Registrar nuevo cliente / Ingreso manual</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.document_type || 'CC'} {c.document_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Tipo Doc.
                  </label>
                  <select
                    value={clientDocTypeInput}
                    onChange={(e) => setClientDocTypeInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-hidden"
                  >
                    <option value="CC">Cédula (C.C.)</option>
                    <option value="NIT">NIT</option>
                    <option value="CE">Cédula Ext. (C.E.)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Nombre Completo o Razón Social
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del cliente"
                    value={clientNameInput}
                    onChange={(e) => setClientNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Número de Identificación
                </label>
                <input
                  type="text"
                  placeholder="Número de identificación"
                  value={clientDocNumInput}
                  onChange={(e) => setClientDocNumInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:outline-hidden"
                />
              </div>
            </Card>

            {/* Card Ítems */}
            <Card padding="md" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Ítems
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={addItem}
                >
                  Agregar
                </Button>
              </div>

              {/* Lista de Filas de Ítems */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Descripción del ítem o servicio"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Cant."
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 text-center"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="Precio Unit."
                        value={item.unit_price || ''}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 text-right"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between gap-1 pl-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {formatCOP(item.total_price)}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Card Ajustes Tributarios */}
            <Card padding="md" className="space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Ajustes tributarios
              </h2>

              <div className="space-y-4">
                {/* Checkbox ReteFuente */}
                <div className="flex items-start gap-3">
                  <input
                    id="retentionApplied"
                    type="checkbox"
                    checked={retentionApplied}
                    onChange={(e) => setRetentionApplied(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="space-y-1">
                    <label htmlFor="retentionApplied" className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">
                      Aplicar retención en la fuente (Art. 383 E.T.)
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ReteFuente aplicable a pagos/abonos en cuenta por honorarios o servicios.
                    </p>
                  </div>
                </div>

                {/* Slider Tarifa ReteFuente */}
                {retentionApplied && (
                  <div className="pl-7 space-y-2 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">Tarifa de Retención</span>
                      <span className="text-blue-600 dark:text-blue-400">{retentionRate.toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min="2.5"
                      max="11"
                      step="0.5"
                      value={retentionRate}
                      onChange={(e) => setRetentionRate(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                )}

                {/* Checkbox IVA */}
                <div className="flex items-start gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <input
                    id="taxApplied"
                    type="checkbox"
                    checked={taxRate > 0}
                    onChange={(e) => setTaxRate(e.target.checked ? 19 : 0)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="space-y-1">
                    <label htmlFor="taxApplied" className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">
                      IVA (19%) — No aplica Decreto 522 / Art. 437 E.T.
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Habilitar únicamente si la persona natural o empresa es responsable de IVA.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* COLUMNA DERECHA (~5/12 cols): Panel de Resumen Fijo / Sticky */}
          <div className="md:col-span-5 md:sticky md:top-24 space-y-4">
            
            <Card padding="md" className="space-y-6 shadow-md border-slate-300 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                Resumen del documento
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCOP(summary.subtotal)}</span>
                </div>

                {summary.retentionAmount > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>ReteFuente (-{retentionRate}%)</span>
                    <span className="font-semibold">-{formatCOP(summary.retentionAmount)}</span>
                  </div>
                )}

                {summary.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>IVA (+19%)</span>
                    <span className="font-semibold">{formatCOP(summary.taxAmount)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">Total</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatCOP(summary.totalAmount)}
                  </span>
                </div>

                {summary.amountInWords && (
                  <div className="pt-2 text-xs italic text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                    &quot;{summary.amountInWords}&quot;
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full shadow-md py-3 text-base font-bold"
              >
                {saving ? 'Generando documento...' : 'Generar documento'}
              </Button>
            </Card>

          </div>

        </div>

        {/* Floating Mobile Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex md:hidden items-center justify-between z-40 gap-4 shadow-lg">
          <div>
            <span className="text-2xs uppercase tracking-wider text-slate-400 block font-bold">Total a pagar</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{formatCOP(summary.totalAmount)}</span>
          </div>
          <Button type="submit" disabled={saving} size="md">
            {saving ? 'Guardando...' : 'Generar'}
          </Button>
        </div>

      </form>

    </div>
  );
}
