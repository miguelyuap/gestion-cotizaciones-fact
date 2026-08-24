'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  UserPlus, 
  Calculator, 
  Save, 
  FileText, 
  Building2, 
  AlertCircle,
  Percent
} from 'lucide-react';
import { Client, DocumentItem, DocumentType, Profile } from '@/lib/types';
import { getClients, createClient, saveDocument, getProfile, getDocuments } from '@/lib/storage';
import { formatCOP, generateNextNumber } from '@/lib/utils';

export default function DocumentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Campos del Formulario
  const [type, setType] = useState<DocumentType>('bill');
  const [number, setNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [notes, setNotes] = useState('');

  // Retención en la fuente
  const [retentionApplied, setRetentionApplied] = useState(false);
  const [retentionRate, setRetentionRate] = useState<number>(2.5);

  // Tabla Dinámica de Ítems
  const [items, setItems] = useState<DocumentItem[]>([
    { description: 'Servicios profesionales de desarrollo web y soporte técnico', quantity: 1, unit_price: 1500000, total_price: 1500000 }
  ]);

  // Modal para Creación Rápida de Cliente
  const [showQuickClientModal, setShowQuickClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDocType, setNewClientDocType] = useState('NIT');
  const [newClientDocNum, setNewClientDocNum] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([getClients(), getProfile(), getDocuments()]).then(([cls, prof, existingDocs]) => {
      if (!mounted) return;
      setClients(cls);
      setProfile(prof);

      if (cls.length > 0) {
        setSelectedClientId((prev) => prev || cls[0].id);
      }

      const typeDocs = existingDocs.filter((d) => d.type === 'bill');
      setNumber(generateNextNumber('bill', typeDocs.length));
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Al cambiar el tipo de documento (Cotización / Cuenta de Cobro), actualizar consecutivo
  const handleTypeChange = async (newType: DocumentType) => {
    setType(newType);
    const existingDocs = await getDocuments();
    const typeDocs = existingDocs.filter((d) => d.type === newType);
    setNumber(generateNextNumber(newType, typeDocs.length));
  };

  // Manejo de Items dinámicos
  const handleItemChange = (index: number, field: keyof DocumentItem, value: string | number) => {
    const updatedItems = [...items];
    const item = { ...updatedItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      const q = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity)) || 0;
      const p = typeof item.unit_price === 'number' ? item.unit_price : parseFloat(String(item.unit_price)) || 0;
      item.total_price = q * p;
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

  // Cálculos Automáticos de Subtotal, Retención y Total
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
  const retentionAmount = retentionApplied ? (subtotal * (retentionRate / 100)) : 0;
  const totalAmount = subtotal - retentionAmount;

  // Guardar rápido nuevo cliente
  const handleCreateQuickClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientDocNum) return;

    const created = await createClient({
      name: newClientName,
      document_type: newClientDocType,
      document_number: newClientDocNum,
      email: newClientEmail,
      phone: newClientPhone,
      address: newClientAddress,
    });

    setClients([...clients, created]);
    setSelectedClientId(created.id);
    setShowQuickClientModal(false);
    
    // Limpiar campos modal
    setNewClientName('');
    setNewClientDocNum('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientAddress('');
  };

  // Guardar Documento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      alert('Por favor selecciona o crea un cliente para el documento.');
      return;
    }

    if (items.length === 0 || subtotal <= 0) {
      alert('Por favor agrega al menos un ítem con valor superior a 0.');
      return;
    }

    setSaving(true);
    try {
      const saved = await saveDocument({
        client_id: selectedClientId,
        type,
        number,
        date,
        due_date: dueDate || undefined,
        retention_applied: retentionApplied,
        retention_rate: retentionRate,
        retention_amount: retentionAmount,
        subtotal,
        total_amount: totalAmount,
        status: 'draft',
        notes,
        document_items: items,
      });

      router.push(`/documents/${saved.id}`);
    } catch (err) {
      console.error(err);
      alert('Error guardando el documento');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Cargando formulario...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* 1. Selector de Tipo de Documento y Consecutivo */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Tipo de Documento Normativo
            </h2>
            <p className="text-xs text-slate-500">
              Selecciona si deseas generar una Cotización comercial o una Cuenta de Cobro.
            </p>
          </div>

          {/* Switch Selector */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => handleTypeChange('bill')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                type === 'bill'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cuenta de Cobro
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('quotation')}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                type === 'quotation'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cotización
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Número de Consecutivo
            </label>
            <input
              type="text"
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Fecha de Emisión
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Fecha Limite / Vencimiento
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Selección de Cliente */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Información del Cliente / Receptor
          </h2>
          <button
            type="button"
            onClick={() => setShowQuickClientModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg border border-blue-200 transition"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Cliente Rápido
          </button>
        </div>

        {clients.length > 0 ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Seleccionar Cliente Existente (Supabase)
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — ({c.document_type}: {c.document_number})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex justify-between items-center">
            <span>No tienes clientes registrados aún. Haz clic para agregar el primero.</span>
            <button
              type="button"
              onClick={() => setShowQuickClientModal(true)}
              className="px-3 py-1.5 bg-amber-600 text-white font-semibold rounded-md text-xs"
            >
              Crear Cliente
            </button>
          </div>
        )}
      </div>

      {/* 3. Tabla Dinámica de Ítems */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Detalle de Conceptos / Servicios
            </h2>
            <p className="text-xs text-slate-500">Agrega las líneas de servicio o productos con su valor unitario.</p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Agregar Línea
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase">
                <th className="py-2.5 px-3 w-16 text-center">Cant.</th>
                <th className="py-2.5 px-3">Descripción del Servicio / Producto</th>
                <th className="py-2.5 px-3 w-36 text-right">Precio Unit. (COP)</th>
                <th className="py-2.5 px-3 w-36 text-right">Total</th>
                <th className="py-2.5 px-2 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50">
                  <td className="py-2 px-2 align-top">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full text-center px-2 py-1.5 border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-2 align-top">
                    <textarea
                      rows={2}
                      required
                      placeholder="Escribe el concepto o descripción del servicio..."
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-2 align-top">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      className="w-full text-right px-2 py-1.5 border border-slate-300 rounded text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 align-top pt-3 text-sm">
                    {formatCOP(item.total_price)}
                  </td>
                  <td className="py-2 px-2 text-center align-top pt-2">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded transition"
                      title="Eliminar fila"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bloque de Totales y Retención */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-start gap-6">
          
          {/* Configuración Retención en la fuente */}
          <div className="w-full md:w-1/2 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase cursor-pointer">
                <input
                  type="checkbox"
                  checked={retentionApplied}
                  onChange={(e) => setRetentionApplied(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <Percent className="w-4 h-4 text-blue-600" />
                Aplicar Retención en la Fuente
              </label>
            </div>

            {retentionApplied && (
              <div className="flex items-center gap-3 pt-2">
                <label className="text-xs text-slate-600">Porcentaje ReteFuente:</label>
                <select
                  value={retentionRate}
                  onChange={(e) => setRetentionRate(parseFloat(e.target.value))}
                  className="px-2.5 py-1 border border-slate-300 rounded text-xs font-bold text-slate-900 bg-white"
                >
                  <option value={2.5}>2.5% (Servicios Generales)</option>
                  <option value={3.5}>3.5% (Transporte / Otros)</option>
                  <option value={4.0}>4.0% (Honorarios / Empleadores)</option>
                  <option value={10.0}>10.0% (Honorarios sin contrato)</option>
                  <option value={11.0}>11.0% (Honorarios declarantes)</option>
                </select>
              </div>
            )}
          </div>

          {/* Desglose Matemático */}
          <div className="w-full md:w-1/2 bg-slate-900 text-white p-5 rounded-xl space-y-2">
            <div className="flex justify-between text-sm text-slate-300">
              <span>Subtotal Servicios:</span>
              <span className="font-semibold text-white">{formatCOP(subtotal)}</span>
            </div>

            {retentionApplied && (
              <div className="flex justify-between text-xs text-amber-400">
                <span>(-) Retefuente ({retentionRate}%):</span>
                <span>-{formatCOP(retentionAmount)}</span>
              </div>
            )}

            <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-300">
                {type === 'bill' ? 'Valor Neto a Pagarme:' : 'Total Cotizado:'}
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {formatCOP(totalAmount)}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Notas Adicionales */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
          Notas u Observaciones
        </label>
        <textarea
          rows={2}
          placeholder="Condiciones de pago, tiempo de entrega o validez..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 5. Vista Previa de Normativa Colombiana */}
      {type === 'bill' && profile && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-blue-950">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            Normatividad Aplicable Incorporada Automáticamente:
          </p>
          <p className="italic text-slate-700">{profile.legal_text}</p>
          <p className="font-semibold pt-1 text-slate-800">
            Pago a Bancolombia ({profile.account_type}): N° {profile.account_number} — Titular: {profile.razon_social}
          </p>
        </div>
      )}

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Guardando en Supabase...' : `Generar ${type === 'bill' ? 'Cuenta de Cobro' : 'Cotización'}`}
        </button>
      </div>
      </form>

      {/* Modal Creación Rápida de Cliente */}
      {showQuickClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">
              Crear Nuevo Cliente Rápido
            </h3>
            <form onSubmit={handleCreateQuickClient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nombre o Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. ACME Colombia S.A.S."
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo Doc.</label>
                  <select
                    value={newClientDocType}
                    onChange={(e) => setNewClientDocType(e.target.value)}
                    className="w-full px-2 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="NIT">NIT</option>
                    <option value="CC">C.C.</option>
                    <option value="CE">C.E.</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Número Documento</label>
                  <input
                    type="text"
                    required
                    placeholder="900123456-7"
                    value={newClientDocNum}
                    onChange={(e) => setNewClientDocNum(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="contacto@cliente.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+57 300..."
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Dirección</label>
                  <input
                    type="text"
                    placeholder="Calle 100 # 15-20"
                    value={newClientAddress}
                    onChange={(e) => setNewClientAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowQuickClientModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
