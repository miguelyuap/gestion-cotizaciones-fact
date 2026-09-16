import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (isSupabaseConfigured() && currentUser?.id) {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('name');

      if (!error && data) {
        return NextResponse.json({ clients: data });
      }
    }

    return NextResponse.json({ clients: [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await req.json();

    if (isSupabaseConfigured() && currentUser?.id) {
      const payload = {
        ...(body.id ? { id: body.id } : {}),
        user_id: currentUser.id,
        name: body.name,
        document_type: body.document_type || 'NIT',
        document_number: body.document_number,
        address: body.address || '',
        email: body.email || '',
        phone: body.phone || '',
        city: body.city || '',
      };

      const { data, error } = await supabase
        .from('clients')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ client: data });
    }

    const localClient = {
      id: body.id || `client-${Date.now()}`,
      ...body,
    };
    return NextResponse.json({ client: localClient });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
