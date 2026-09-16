import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getCurrentUser } from './auth';
import { Client, DocumentWithDetails, Profile } from './types';
import { DEFAULT_PROFILE } from './utils';

function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1-demo',
    name: 'TECNOLOGÍA Y DESARROLLO S.A.S.',
    document_type: 'NIT',
    document_number: '901.234.567-8',
    email: 'compras@tecnodevs.com',
    phone: '+57 601 555 1234',
    address: 'Calle 93 # 11-45',
    city: 'Medellín',
  },
  {
    id: 'c2-demo',
    name: 'INVERSIONES AGUILAR & CO.',
    document_type: 'NIT',
    document_number: '800.987.654-3',
    email: 'facturacion@aguilar.co',
    phone: '+57 315 444 8899',
    address: 'Carrera 43A # 1-50',
    city: 'Cali',
  },
];

const INITIAL_DOCUMENTS: DocumentWithDetails[] = [
  {
    id: 'doc1-demo',
    client_id: 'c1-demo',
    type: 'bill',
    number: 'CC-001',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    retention_applied: true,
    retention_rate: 2.5,
    retention_amount: 50000,
    subtotal: 2000000,
    total_amount: 1950000,
    status: 'sent',
    notes: 'Cuenta de cobro por servicios de desarrollo web correspondientes al mes actual.',
    clients: INITIAL_CLIENTS[0],
    document_items: [
      {
        id: 'item1',
        description: 'Desarrollo de módulos e integración de API Supabase + Next.js',
        quantity: 1,
        unit_price: 1500000,
        total_price: 1500000,
      },
      {
        id: 'item2',
        description: 'Optimización de diseño UI/UX e impresiones térmicas POS',
        quantity: 1,
        unit_price: 500000,
        total_price: 500000,
      },
    ],
  },
];

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error guardando en localStorage', e);
  }
}

// --------------------------------------------------------------------
// PROFILES API & SUPABASE LAYER
// --------------------------------------------------------------------
export async function getProfile(): Promise<Profile> {
  const currentUser = await getCurrentUser();
  if (isSupabaseConfigured() && currentUser?.id) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!error && data) {
        const merged = { ...DEFAULT_PROFILE, ...data };
        setLocal('gst_profile', merged);
        return merged;
      }
    } catch (e) {
      console.warn('Error fetching profile directly from Supabase:', e);
    }
  }
  const localProf = getLocal<Profile>('gst_profile', DEFAULT_PROFILE);
  const merged = { ...DEFAULT_PROFILE, ...localProf };
  if (currentUser?.email && !merged.email) merged.email = currentUser.email;
  return merged;
}

export async function saveProfile(profile: Profile): Promise<boolean> {
  const currentUser = await getCurrentUser();
  setLocal('gst_profile', profile);

  if (isSupabaseConfigured() && currentUser?.id) {
    try {
      const cleanPayload = {
        id: currentUser.id,
        razon_social: profile.razon_social || '',
        document_type: profile.document_type || 'CC',
        document_number: profile.document_number || '',
        phone: profile.phone || '',
        email: profile.email || currentUser.email || '',
        address: profile.address || '',
        city: profile.city || '',
        bank_name: profile.bank_name || '',
        account_type: profile.account_type || '',
        account_number: profile.account_number || '',
        account_holder_name: profile.account_holder_name || '',
        account_holder_doc: profile.account_holder_doc || '',
        document_subtitle: profile.document_subtitle || '',
        legal_text: profile.legal_text || '',
        signature_url: profile.signature_url || '',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(cleanPayload, { onConflict: 'id' });

      if (error) {
        console.error('Error upserting profile in Supabase:', error.message || error);
      }
    } catch (e) {
      console.error('Error in saveProfile Supabase query:', e);
    }
  }
  return true;
}

// --------------------------------------------------------------------
// CLIENTS API & SUPABASE LAYER
// --------------------------------------------------------------------
export async function getClients(): Promise<Client[]> {
  const currentUser = await getCurrentUser();
  if (isSupabaseConfigured() && currentUser?.id) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLocal('gst_clients', data);
        return data;
      }
    } catch (e) {
      console.warn('Error fetching clients directly from Supabase:', e);
    }
  }
  return getLocal<Client[]>('gst_clients', INITIAL_CLIENTS);
}

export async function createClient(clientData: Omit<Client, 'id'> & { id?: string }): Promise<Client> {
  const currentUser = await getCurrentUser();
  const isValidId = isValidUUID(clientData.id);
  const clientId = isValidId ? (clientData.id as string) : `client-${Date.now()}`;

  if (isSupabaseConfigured() && currentUser?.id) {
    try {
      const payload = {
        ...(isValidId ? { id: clientData.id } : {}),
        user_id: currentUser.id,
        name: clientData.name,
        document_type: clientData.document_type || 'NIT',
        document_number: clientData.document_number || '0',
        address: clientData.address || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        city: clientData.city || '',
      };

      const { data, error } = await supabase
        .from('clients')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) {
        const current = getLocal<Client[]>('gst_clients', INITIAL_CLIENTS);
        const updated = [data, ...current.filter((c) => c.id !== data.id)];
        setLocal('gst_clients', updated);
        return data;
      } else if (error) {
        console.error('Error upserting client in Supabase:', error.message || error);
      }
    } catch (e) {
      console.error('Error in createClient Supabase query:', e);
    }
  }

  const newClient: Client = {
    id: clientId,
    ...clientData,
  };

  const currentClients = getLocal<Client[]>('gst_clients', INITIAL_CLIENTS);
  const exists = currentClients.some((c) => c.id === clientId);
  const updated = exists ? currentClients.map((c) => (c.id === clientId ? newClient : c)) : [newClient, ...currentClients];
  setLocal('gst_clients', updated);
  return newClient;
}

export async function updateClient(clientData: Client): Promise<Client> {
  return createClient(clientData);
}

// --------------------------------------------------------------------
// DOCUMENTS API & SUPABASE LAYER
// --------------------------------------------------------------------
export async function getDocuments(): Promise<DocumentWithDetails[]> {
  const currentUser = await getCurrentUser();
  if (isSupabaseConfigured() && currentUser?.id) {
    try {
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
        setLocal('gst_documents', data);
        return data;
      }
    } catch (e) {
      console.warn('Error fetching documents directly from Supabase:', e);
    }
  }
  return getLocal<DocumentWithDetails[]>('gst_documents', INITIAL_DOCUMENTS);
}

export async function getDocumentById(id: string): Promise<DocumentWithDetails | null> {
  const currentUser = await getCurrentUser();
  if (isSupabaseConfigured() && currentUser?.id) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          clients (*),
          document_items (*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (!error && data) return data;
    } catch (e) {
      console.warn('Error fetching document detail directly from Supabase:', e);
    }
  }

  const docs = getLocal<DocumentWithDetails[]>('gst_documents', INITIAL_DOCUMENTS);
  return docs.find((d) => d.id === id) || null;
}

export async function saveDocument(
  docData: Omit<DocumentWithDetails, 'id'> & { id?: string }
): Promise<DocumentWithDetails> {
  const currentUser = await getCurrentUser();
  const isValidDocId = isValidUUID(docData.id);
  const isValidClientId = isValidUUID(docData.client_id);
  const docId = isValidDocId ? (docData.id as string) : `doc-${Date.now()}`;

  if (isSupabaseConfigured() && currentUser?.id) {
    try {
      const documentHeader: Record<string, unknown> = {
        ...(isValidDocId ? { id: docData.id } : {}),
        user_id: currentUser.id,
        client_id: isValidClientId ? docData.client_id : null,
        type: docData.type,
        number: docData.number,
        date: docData.date || new Date().toISOString().split('T')[0],
        due_date: docData.due_date && docData.due_date.trim() !== '' ? docData.due_date : null,
        discount_rate: Number(docData.discount_rate) || 0,
        discount_amount: Number(docData.discount_amount) || 0,
        tax_rate: Number(docData.tax_rate) || 0,
        tax_amount: Number(docData.tax_amount) || 0,
        retention_applied: Boolean(docData.retention_applied),
        retention_rate: Number(docData.retention_rate) || 0,
        retention_amount: Number(docData.retention_amount) || 0,
        subtotal: Number(docData.subtotal) || 0,
        total_amount: Number(docData.total_amount) || 0,
        amount_in_words: docData.amount_in_words || '',
        status: docData.status || 'draft',
        notes: docData.notes || '',
      };

      let { data: upsertedDoc, error: docErr } = await supabase
        .from('documents')
        .upsert(documentHeader, { onConflict: 'id' })
        .select()
        .single();

      // Reintento resiliente si la columna 'amount_in_words' no existe aún en la BD remota
      if (docErr && docErr.message?.includes('amount_in_words')) {
        console.warn('Reintentando guardado en Supabase omitiendo la columna amount_in_words...');
        delete documentHeader.amount_in_words;
        const retryRes = await supabase
          .from('documents')
          .upsert(documentHeader, { onConflict: 'id' })
          .select()
          .single();

        upsertedDoc = retryRes.data;
        docErr = retryRes.error;
      }

      if (!docErr && upsertedDoc) {
        await supabase.from('document_items').delete().eq('document_id', upsertedDoc.id);

        const itemsToInsert = (docData.document_items || []).map((it) => ({
          document_id: upsertedDoc.id,
          description: it.description,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || 0,
          discount_rate: Number(it.discount_rate) || 0,
          tax_rate: Number(it.tax_rate) || 0,
          total_price: Number(it.total_price) || 0,
        }));

        if (itemsToInsert.length > 0) {
          const { error: itemsErr } = await supabase.from('document_items').insert(itemsToInsert);
          if (itemsErr) console.error('Error inserting document_items in Supabase:', itemsErr.message || itemsErr);
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

        const result = fullDoc || upsertedDoc;
        const currentDocs = getLocal<DocumentWithDetails[]>('gst_documents', []);
        const updated = [result, ...currentDocs.filter((d) => d.id !== result.id)];
        setLocal('gst_documents', updated);
        return result;
      } else if (docErr) {
        console.error('Error saving document in Supabase:', docErr.message || docErr);
      }
    } catch (e) {
      console.error('Error in saveDocument Supabase query:', e);
    }
  }

  const currentDocs = getLocal<DocumentWithDetails[]>('gst_documents', INITIAL_DOCUMENTS);
  const clients = await getClients();
  const matchedClient = clients.find((c) => c.id === docData.client_id) || null;

  const fullDoc: DocumentWithDetails = {
    id: docId,
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
    status: docData.status,
    notes: docData.notes,
    clients: matchedClient,
    document_items: docData.document_items || [],
  };

  const exists = currentDocs.some((d) => d.id === docId);
  const updatedDocs = exists ? currentDocs.map((d) => (d.id === docId ? fullDoc : d)) : [fullDoc, ...currentDocs];
  setLocal('gst_documents', updatedDocs);
  return fullDoc;
}

export async function updateDocumentStatus(id: string, status: DocumentWithDetails['status']): Promise<boolean> {
  const currentUser = await getCurrentUser();
  if (isSupabaseConfigured() && currentUser?.id) {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status })
        .eq('id', id);

      if (error) console.error('Error updating document status in Supabase:', error.message || error);
    } catch (e) {
      console.error('Error updating status in Supabase:', e);
    }
  }

  const currentDocs = getLocal<DocumentWithDetails[]>('gst_documents', INITIAL_DOCUMENTS);
  const updated = currentDocs.map((d) => (d.id === id ? { ...d, status } : d));
  setLocal('gst_documents', updated);
  return true;
}
