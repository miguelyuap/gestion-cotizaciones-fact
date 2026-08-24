'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { subscribeToAuthChanges, getCurrentUser } from '@/lib/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const isPublicRoute = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    let mounted = true;

    // Verificar usuario actual
    getCurrentUser().then((user) => {
      if (!mounted) return;
      if (user) {
        setAuthenticated(true);
        if (isPublicRoute) {
          router.push('/');
        }
      } else {
        setAuthenticated(false);
        if (!isPublicRoute) {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    const unsubscribe = subscribeToAuthChanges((user) => {
      if (!mounted) return;
      if (user) {
        setAuthenticated(true);
        if (isPublicRoute) {
          router.push('/');
        }
      } else {
        setAuthenticated(false);
        if (!isPublicRoute) {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [pathname, isPublicRoute, router]);

  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Verificando sesión...
      </div>
    );
  }

  if (!authenticated && !isPublicRoute) {
    return null;
  }

  return <>{children}</>;
}
