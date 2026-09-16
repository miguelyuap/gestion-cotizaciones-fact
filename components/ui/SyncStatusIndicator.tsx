'use client';

import { useState, useEffect } from 'react';
import { Database, HardDrive } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabaseClient';

export default function SyncStatusIndicator() {
  const [supabaseConnected] = useState(() => isSupabaseConfigured());
  const [isOnline, setIsOnline] = useState(() => (typeof window !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800/90 border border-slate-700 text-slate-300 shadow-2xs"
      title={
        supabaseConnected
          ? isOnline
            ? 'Sincronizado con Supabase Cloud DB'
            : 'Sin conexión a internet. Cambiado a almacenamiento local.'
          : 'Modo Local / Demo activo (localStorage)'
      }
    >
      {supabaseConnected && isOnline ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline text-[11px]">Cloud</span>
        </>
      ) : (
        <>
          <HardDrive className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] text-amber-300">Local</span>
        </>
      )}
    </div>
  );
}
