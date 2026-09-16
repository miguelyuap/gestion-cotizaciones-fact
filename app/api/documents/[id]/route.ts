import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          clients (*),
          document_items (*)
        `)
        .eq('id', id)
        .single();

      if (!error && data) {
        return NextResponse.json({ document: data });
      }
    }
    return NextResponse.json({ document: null }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('documents').update({ status }).eq('id', id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, localOnly: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
