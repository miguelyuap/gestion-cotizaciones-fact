import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'GST Cotizaciones & Cobros | Normatividad Colombia',
  description: 'Sistema web para la emisión y gestión de Cotizaciones y Cuentas de Cobro optimizado para Vercel y Supabase bajo normatividad colombiana (Art. 383 E.T.).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AuthGuard>{children}</AuthGuard>
          </main>
          <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 no-print transition-colors">
            <p>© {new Date().getFullYear()} GST Cotizaciones & Cobros — Normatividad Colombiana</p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
