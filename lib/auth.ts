import { supabase, isSupabaseConfigured } from './supabaseClient';
import { User } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  razonSocial: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// --------------------------------------------------------------------
// REGISTRO E INSERCIÓN DIRECTA EN SUPABASE
// --------------------------------------------------------------------
export async function signUpUser({ email, password, razonSocial }: SignUpData) {
  if (!isSupabaseConfigured()) {
    const mockUser: User = {
      id: 'demo-user-123',
      app_metadata: {},
      user_metadata: { razon_social: razonSocial },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: email,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('gst_auth_user', JSON.stringify(mockUser));
    }
    return { user: mockUser, error: null };
  }

  // 1. Crear usuario en Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        razon_social: razonSocial,
      },
    },
  });

  if (error) return { user: null, error };

  // 2. Intentar inicio de sesión automático si no hay sesión activa aún
  let currentUser = data.user;
  if (!data.session) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!signInError && signInData.user) {
      currentUser = signInData.user;
    } else if (signInError) {
      // Si el error es por verificación de correo pendiente en Supabase Dashboard
      console.warn('Inicio de sesión inmediato post-registro:', signInError.message);
    }
  }

  // 3. Garantizar que el registro exista en la tabla public.profiles
  if (currentUser) {
    try {
      await supabase.from('profiles').upsert(
        {
          id: currentUser.id,
          email: currentUser.email,
          razon_social: razonSocial || 'MI EMPRESA S.A.S.',
        },
        { onConflict: 'id' }
      );
    } catch (e) {
      console.warn('Error al guardar en tabla public.profiles:', e);
    }
  }

  return { user: currentUser, error: null };
}

// --------------------------------------------------------------------
// INICIO DE SESIÓN
// --------------------------------------------------------------------
export async function signInUser({ email, password }: SignInData) {
  if (!isSupabaseConfigured()) {
    const mockUser: User = {
      id: 'demo-user-123',
      app_metadata: {},
      user_metadata: { razon_social: 'Usuario Demo' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: email,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('gst_auth_user', JSON.stringify(mockUser));
    }
    return { user: mockUser, error: null };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { user: null, error };

  // Asegurar perfil al ingresar
  if (data.user) {
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email: data.user.email,
            razon_social: data.user.user_metadata?.razon_social || 'MI EMPRESA S.A.S.',
          },
        ]);
      }
    } catch (e) {
      console.warn('Verificación de perfil al iniciar sesión:', e);
    }
  }

  return { user: data.user, error: null };
}

// --------------------------------------------------------------------
// CIERRE DE SESIÓN
// --------------------------------------------------------------------
export async function signOutUser() {
  if (!isSupabaseConfigured()) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gst_auth_user');
    }
    return { error: null };
  }
  return await supabase.auth.signOut();
}

// --------------------------------------------------------------------
// OBTENER USUARIO ACTUAL
// --------------------------------------------------------------------
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gst_auth_user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  }

  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------------
// SUSCRIPCIÓN A CAMBIOS DE SESIÓN
// --------------------------------------------------------------------
export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  if (!isSupabaseConfigured()) {
    const checkLocal = () => {
      const user = getCurrentUser();
      user.then(callback);
    };
    checkLocal();
    const interval = setInterval(checkLocal, 1000);
    return () => clearInterval(interval);
  }

  const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });

  return () => {
    authListener.subscription.unsubscribe();
  };
}
