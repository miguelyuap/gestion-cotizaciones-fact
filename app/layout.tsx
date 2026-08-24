import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

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
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AuthGuard>{children}</AuthGuard>
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
          <p>© {new Date().getFullYear()} GST Cotizaciones & Cobros — Normatividad Colombiana. Desarrollado con Next.js & Supabase.</p>
        </footer>
      </body>
    </html>
  );
}
