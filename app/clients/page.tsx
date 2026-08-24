'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Search, 
  Plus
} from 'lucide-react';
import { Client } from '@/lib/types';
import { getClients, createClient } from '@/lib/storage';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State para Nuevo Cliente
  const [name, setName] = useState('');
  const [docType, setDocType] = useState('NIT');
  const [docNum, setDocNum] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Colombia');

  const refreshClients = async () => {
    const cls = await getClients();
    setClients(cls);
  };

  useEffect(() => {
    let mounted = true;
    getClients().then((cls) => {
      if (mounted) {
        setClients(cls);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !docNum) return;

    await createClient({
      name,
      document_type: docType,
      document_number: docNum,
      email,
      phone,
      address,
      city,
    });

    setShowModal(false);
    setName('');
    setDocNum('');
    setEmail('');
    setPhone('');
    setAddress('');
    refreshClients();
  };

  const filteredClients = clients.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.document_number.toLowerCase().includes(term);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Cargando listado de clientes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Directorio de Clientes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra la información de personas o empresas receptoras de tus cotizaciones y cuentas de cobro.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente o documento NIT/CC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <div key={client.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-blue-300 transition">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                  {client.document_type || 'NIT'}: {client.document_number}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">{client.name}</h3>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-100">
                {client.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {client.email}
                  </p>
                )}
                {client.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {client.phone}
                  </p>
                )}
                {client.address && (
                  <p className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {client.address} {client.city ? `(${client.city})` : ''}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white p-12 rounded-xl text-center text-slate-500 border border-slate-200">
            No se encontraron clientes. Haz clic en &quot;Nuevo Cliente&quot; para registrar el primero.
          </div>
        )}
      </div>

      {/* Modal Nuevo Cliente */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">
              Crear Nuevo Cliente
            </h3>
            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nombre o Razón Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. ACME Colombia S.A.S."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo Doc.</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-2 py-2 border rounded-lg text-sm bg-white text-slate-900"
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
                    placeholder="900.123.456-7"
                    value={docNum}
                    onChange={(e) => setDocNum(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="contacto@cliente.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+57 300..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ciudad</label>
                  <input
                    type="text"
                    placeholder="Bogotá D.C."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Dirección</label>
                <input
                  type="text"
                  placeholder="Calle 100 # 15-20"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
