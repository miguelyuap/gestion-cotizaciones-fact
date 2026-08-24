/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Building2, 
  CreditCard, 
  Scale, 
  Save, 
  CheckCircle,
  FileSignature,
  Upload,
  Trash2
} from 'lucide-react';
import { Profile } from '@/lib/types';
import { getProfile, saveProfile } from '@/lib/storage';
import { DEFAULT_LEGAL_TEXT } from '@/lib/utils';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [formData, setFormData] = useState<Profile>({
    razon_social: '',
    document_type: 'CC',
    document_number: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    bank_name: 'Bancolombia',
    account_type: 'Ahorros',
    account_number: '',
    legal_text: DEFAULT_LEGAL_TEXT,
    signature_url: '',
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const prof = await getProfile();
      if (prof) setFormData(prof);
      setLoading(false);
    }
    load();
  }, []);

  const handleChange = (field: keyof Profile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  // Carga de archivo de firma (conversión a Base64 Data URL)
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (.png, .jpg, .svg)');
      return;
    }

    // Límite 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen de la firma debe ser menor a 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleChange('signature_url', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    handleChange('signature_url', '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProfile(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Error guardando perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Cargando perfil emisor...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-blue-600" />
          Datos del Emisor / Facturador
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configura tus datos personales o empresariales, cuenta Bancolombia, firma digital y texto legal normativo para tus Cuentas de Cobro.
        </p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          ¡Datos del emisor y firma digital actualizados correctamente!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Datos Identificación Emisor */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            1. Información Identificación y Contacto
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Razón Social / Nombre Completo
              </label>
              <input
                type="text"
                required
                value={formData.razon_social}
                onChange={(e) => handleChange('razon_social', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo Doc.</label>
                <select
                  value={formData.document_type}
                  onChange={(e) => handleChange('document_type', e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900"
                >
                  <option value="CC">C.C.</option>
                  <option value="NIT">NIT</option>
                  <option value="CE">C.E.</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Número Documento</label>
                <input
                  type="text"
                  required
                  value={formData.document_number}
                  onChange={(e) => handleChange('document_number', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Teléfono Móvil / Fijo</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Dirección Física</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ciudad y Departamento</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* 2. Firma Digital del Emisor */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-indigo-600" />
            2. Imagen de Firma Digital
          </h2>
          <p className="text-xs text-slate-500">
            Sube una imagen limpia de tu firma (formato PNG transparente o JPG). Esta imagen aparecerá sobre la línea de firma en tus cotizaciones y cuentas de cobro.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {formData.signature_url ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-64 h-28 border border-dashed border-slate-300 rounded-lg bg-slate-50 flex items-center justify-center p-2 relative group">
                  {/* eslint-disable-next-html-element-suppress */}
                  <img
                    src={formData.signature_url}
                    alt="Firma Digital Emisor"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveSignature}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar / Cambiar Firma
                </button>
              </div>
            ) : (
              <label className="w-full sm:w-80 h-32 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-indigo-50/40 transition">
                <Upload className="w-8 h-8 text-indigo-500 mb-1" />
                <span className="text-xs font-bold text-slate-700">Subir Imagen de Firma</span>
                <span className="text-[10px] text-slate-400">PNG, JPG o SVG (Máx 2MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
              </label>
            )}

            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Consejos para una firma clara:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                <li>Utiliza fondo blanco o transparente (PNG).</li>
                <li>Asegúrate de que el trazo de la firma sea oscuro y visible.</li>
                <li>Si tienes un PDF firmado (ej. en Descargas), tómale una captura recortada a la firma.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 3. Datos Bancarios (Bancolombia) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            3. Datos Bancarios (Requerido para Cuentas de Cobro)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Entidad Bancaria</label>
              <input
                type="text"
                required
                value={formData.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tipo de Cuenta</label>
              <select
                value={formData.account_type}
                onChange={(e) => handleChange('account_type', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-900"
              >
                <option value="Ahorros">Cuenta de Ahorros</option>
                <option value="Corriente">Cuenta Corriente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Número de Cuenta</label>
              <input
                type="text"
                required
                value={formData.account_number}
                onChange={(e) => handleChange('account_number', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* 4. Normativa Legal Colombia */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600" />
              4. Texto Legal Normativo (Art. 383 Estatuto Tributario)
            </h2>
            <button
              type="button"
              onClick={() => handleChange('legal_text', DEFAULT_LEGAL_TEXT)}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Restablecer Texto Oficial
            </button>
          </div>

          <div>
            <textarea
              rows={4}
              value={formData.legal_text}
              onChange={(e) => handleChange('legal_text', e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg text-xs leading-relaxed text-slate-800 font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando en Supabase...' : 'Guardar Datos Emisor y Firma'}
          </button>
        </div>

      </form>
    </div>
  );
}
