import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (isSupabaseConfigured() && currentUser?.id) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({ profile: data });
      }
    }

    const meta = currentUser?.user_metadata || {};
    return NextResponse.json({
      profile: {
        id: currentUser?.id,
        razon_social: meta.razon_social || '',
        document_type: meta.document_type || 'CC',
        document_number: meta.document_number || '',
        phone: meta.phone || '',
        email: currentUser?.email || meta.email || '',
        address: meta.address || '',
        city: meta.city || '',
        bank_name: 'Bancolombia',
        account_type: 'Ahorros',
        account_number: '',
        legal_text: 'Hago constar bajo la gravedad de juramento que no he contratado o vinculado dos (2) o más trabajadores o contratistas asociados a mi actividad económica por un término igual o superior a noventa (90) días continuos o discontinuos dentro del mismo año gravable (Art. 383 del Estatuto Tributario y Decreto 522 de 2003). Persona Natural No Responsable de IVA (Art. 437 Parágrafo 3 E.T.).',
        signature_url: '',
      },
    });
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
      const cleanPayload = {
        id: currentUser.id,
        razon_social: body.razon_social || '',
        document_type: body.document_type || 'CC',
        document_number: body.document_number || '',
        phone: body.phone || '',
        email: body.email || currentUser.email || '',
        address: body.address || '',
        city: body.city || '',
        bank_name: body.bank_name || '',
        account_type: body.account_type || '',
        account_number: body.account_number || '',
        legal_text: body.legal_text || '',
        signature_url: body.signature_url || '',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(cleanPayload, { onConflict: 'id' });

      if (error) {
        console.error('Supabase profile upsert error:', error);
        throw error;
      }
      return NextResponse.json({ success: true, profile: cleanPayload });
    }

    return NextResponse.json({ success: true, localOnly: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
