/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Save, Upload, Trash2, Building, CreditCard, ShieldCheck } from 'lucide-react';
import { Profile } from '@/lib/types';
import { getProfile, saveProfile } from '@/lib/storage';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const [profile, setProfile] = useState<Profile>({
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
    legal_text: '',
    signature_url: '',
  });

  useEffect(() => {
    let mounted = true;
    getProfile().then((prof) => {
      if (mounted) {
        setProfile(prof);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (field: keyof Profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen de la firma no debe superar 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfile((prev) => ({ ...prev, signature_url: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    setProfile((prev) => ({ ...prev, signature_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProfile(profile);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Error al guardar los datos del emisor.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 dark:text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Cargando información del emisor...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Perfil del Emisor / Datos Propios
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Configura tus datos fiscales y bancarios. Se incluirán automáticamente en tus Cuentas de Cobro y Cotizaciones.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ¡Los datos del emisor y la firma han sido guardados exitosamente!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. Datos Identificación */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            1. Información Legal y Contacto
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Nombre Completo o Razón Social (Emisor)
              </label>
              <input
                type="text"
                required
                value={profile.razon_social}
                onChange={(e) => handleChange('razon_social', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Tipo Documento</label>
              <select
                value={profile.document_type}
                onChange={(e) => handleChange('document_type', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="CC">Cédula de Ciudadanía (C.C.)</option>
                <option value="NIT">NIT</option>
                <option value="CE">Cédula de Extranjería (C.E.)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Número de Documento</label>
              <input
                type="text"
                required
                value={profile.document_number}
                onChange={(e) => handleChange('document_number', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Teléfono Móvil / Fijo</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                value={profile.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Dirección de Domicilio</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Ciudad / Municipio</label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* 2. Firma Digital */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            2. Imagen de Firma Digital
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-64 h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
              {profile.signature_url ? (
                <img
                  src={profile.signature_url}
                  alt="Firma emisor"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400 text-center font-medium">Sin firma cargada</span>
              )}
            </div>

            <div className="space-y-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer transition">
                <Upload className="w-4 h-4" />
                Subir Imagen de Firma
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
              </label>

              {profile.signature_url && (
                <div>
                  <button
                    type="button"
                    onClick={handleRemoveSignature}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 hover:bg-red-100 text-xs font-semibold rounded-lg border border-red-200 dark:border-red-800 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar Firma
                  </button>
                </div>
              )}
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Formatos recomendados: PNG con fondo transparente o JPG. Tamaño máx: 2 MB.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Datos Bancarios */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            3. Cuenta Bancaria para Recibir Transferencias
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Entidad Bancaria</label>
              <input
                type="text"
                required
                value={profile.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Tipo de Cuenta</label>
              <select
                value={profile.account_type}
                onChange={(e) => handleChange('account_type', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="Ahorros">Cuenta de Ahorros</option>
                <option value="Corriente">Cuenta Corriente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">Número de Cuenta</label>
              <input
                type="text"
                required
                value={profile.account_number}
                onChange={(e) => handleChange('account_number', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Nombre del Titular de la Cuenta (Opcional - Si difiere del Emisor)
              </label>
              <input
                type="text"
                placeholder={profile.razon_social || 'Nombre completo del titular'}
                value={profile.account_holder_name || ''}
                onChange={(e) => handleChange('account_holder_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* 4. Declaración Juramentada y Subtítulo Legal */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            4. Textos Legales y Encabezado de Cuenta de Cobro (Art. 383 E.T.)
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Subtítulo del Documento (Normativa / Decreto)
              </label>
              <input
                type="text"
                value={profile.document_subtitle || ''}
                onChange={(e) => handleChange('document_subtitle', e.target.value)}
                placeholder="MODELO DE DOCUMENTO EQUIVALENTE A FACTURA (Art. 3 Decreto 522 de Marzo de 2003)"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Texto de Declaración Legal
              </label>
              <textarea
                rows={3}
                required
                value={profile.legal_text}
                onChange={(e) => handleChange('legal_text', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg text-xs text-slate-900 dark:text-slate-100 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar Datos Emisor y Firma'}
          </button>
        </div>

      </form>
    </div>
  );
}
