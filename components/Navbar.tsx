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
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Sun,
  Moon
} from 'lucide-react';
import { signOutUser, subscribeToAuthChanges } from '@/lib/auth';
import { useTheme } from '@/components/ThemeProvider';
import { User } from '@supabase/supabase-js';
import SyncStatusIndicator from '@/components/ui/SyncStatusIndicator';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
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
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-slate-100 sticky top-0 z-40 shadow-xs border-b border-slate-200/80 dark:border-slate-800 no-print transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo y Marca */}
          <Link href="/" className="flex items-center gap-3 font-bold text-xl tracking-tight hover:opacity-90 transition">
            <div className="bg-blue-600 p-2 rounded-xl text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 via-blue-700 to-blue-600 dark:from-white dark:via-blue-300 dark:to-indigo-200 bg-clip-text text-transparent font-black tracking-tight">
              GST Cuentas de Cobro
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
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Botón de Cambio de Tema (Modo Oscuro / Claro) + Auth Controls */}
          <div className="hidden sm:flex items-center gap-3">

            {/* Switcher Tema Claro / Oscuro */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition theme-toggle flex items-center gap-2 text-xs font-bold border border-slate-200 dark:border-slate-700/80 shadow-2xs"
              title={mounted && theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {mounted && theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden lg:inline text-amber-300">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                  <span className="hidden lg:inline text-slate-700 dark:text-indigo-200">Modo Oscuro</span>
                </>
              )}
            </button>

            {/* Indicador de Sincronización Cloud / Local */}
            <SyncStatusIndicator />

            {/* Usuario Activo y Logout */}
            {user && (
              <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <UserIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="max-w-[130px] truncate font-semibold">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/70 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800/80 transition"
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
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                {mounted && theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Menú desplegable Móvil */}
      {mobileMenuOpen && !isAuthPage && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-semibold ${
                  isActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}

          {user && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div className="w-full flex items-center justify-between">
                <span className="truncate max-w-[180px] text-slate-800 dark:text-slate-200 font-semibold">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs"
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
