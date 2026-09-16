import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { getCurrentUser } from '@/lib/auth';
import { DocumentItem } from '@/lib/types';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (isSupabaseConfigured() && currentUser?.id) {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          clients (*),
          document_items (*)
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return NextResponse.json({ documents: data });
      }
    }

    return NextResponse.json({ documents: [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const docData = await req.json();

    const documentHeader = {
      ...(docData.id ? { id: docData.id } : {}),
      user_id: currentUser?.id || undefined,
      client_id: docData.client_id,
      type: docData.type,
      number: docData.number,
      date: docData.date,
      due_date: docData.due_date,
      discount_rate: docData.discount_rate || 0,
      discount_amount: docData.discount_amount || 0,
      tax_rate: docData.tax_rate || 0,
      tax_amount: docData.tax_amount || 0,
      retention_applied: docData.retention_applied,
      retention_rate: docData.retention_rate,
      retention_amount: docData.retention_amount,
      subtotal: docData.subtotal,
      total_amount: docData.total_amount,
      amount_in_words: docData.amount_in_words || '',
      status: docData.status || 'draft',
      notes: docData.notes,
    };

    const items: DocumentItem[] = docData.document_items || [];

    if (isSupabaseConfigured() && currentUser?.id) {
      const { data: upsertedDoc, error: docErr } = await supabase
        .from('documents')
        .upsert([documentHeader], { onConflict: 'id' })
        .select()
        .single();

      if (docErr) throw docErr;

      // Si existían ítems previos del documento, limpiarlos antes de reinsertar los actualizados
      await supabase.from('document_items').delete().eq('document_id', upsertedDoc.id);

      const itemsToInsert = items.map((it: DocumentItem) => ({
        document_id: upsertedDoc.id,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        discount_rate: it.discount_rate || 0,
        tax_rate: it.tax_rate || 0,
        total_price: it.total_price,
      }));

      if (itemsToInsert.length > 0) {
        const { error: itemsErr } = await supabase.from('document_items').insert(itemsToInsert);
        if (itemsErr) throw itemsErr;
      }

      const { data: fullDoc } = await supabase
        .from('documents')
        .select(`
          *,
          clients (*),
          document_items (*)
        `)
        .eq('id', upsertedDoc.id)
        .single();

      return NextResponse.json({ document: fullDoc || upsertedDoc });
    }

    const localDoc = {
      id: docData.id || `doc-${Date.now()}`,
      ...documentHeader,
      document_items: items,
    };
    return NextResponse.json({ document: localDoc });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
