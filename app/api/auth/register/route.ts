import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { email, password, razonSocial } = await req.json();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        user: {
          id: 'demo-user-123',
          email,
          user_metadata: { razon_social: razonSocial },
        },
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          razon_social: razonSocial,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    let currentUser = data.user;
    if (!data.session) {
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInData?.user) currentUser = signInData.user;
    }

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
        console.warn('Upsert profile post-signup error:', e);
      }
    }

    return NextResponse.json({ user: currentUser, session: data.session });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
