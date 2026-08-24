'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FileText, 
  PlusCircle, 
  Users, 
  UserCheck, 
  LayoutDashboard, 
  Database,
  Menu,
  X,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { signOutUser, subscribeToAuthChanges } from '@/lib/auth';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [supabaseConnected] = useState(() => isSupabaseConfigured());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/documents/new', label: 'Nuevo Documento', icon: PlusCircle },
    { href: '/clients', label: 'Clientes', icon: Users },
    { href: '/profile', label: 'Datos Emisor', icon: UserCheck },
  ];

  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo y Nombre */}
          <Link href="/" className="flex items-center gap-3 font-bold text-xl tracking-tight hover:opacity-90 transition">
            <div className="bg-blue-600 p-2 rounded-lg text-white flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="bg-gradient-to-r from-blue-400 to-indigo-200 bg-clip-text text-transparent">
              GST Cotizaciones & Cobros
            </span>
          </Link>

          {/* Navegación Desktop */}
          {!isAuthPage && (
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Estado de Usuario / Auth Controls */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700">
              <Database className={`w-3.5 h-3.5 ${supabaseConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-slate-300">
                {supabaseConnected ? 'Supabase DB' : 'Modo Demo'}
              </span>
            </div>

            {user && (
              <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span className="max-w-[140px] truncate font-medium">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-bold rounded-lg border border-red-800 transition"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Salir
                </button>
              </div>
            )}
          </div>

          {/* Botón Menú Móvil */}
          {!isAuthPage && (
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Menú desplegable Móvil */}
      {mobileMenuOpen && !isAuthPage && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}

          {user && (
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="w-full flex items-center justify-between">
                <span className="truncate max-w-[200px] text-slate-300 font-medium">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-900 text-white rounded text-xs font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" /> Salir
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
