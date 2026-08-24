import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getCurrentUser } from './auth';
import { Client, DocumentWithDetails, Profile } from './types';
import { DEFAULT_PROFILE } from './utils';

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
  {
    id: 'doc2-demo',
    client_id: 'c2-demo',
    type: 'quotation',
    number: 'COT-001',
    date: new Date().toISOString().split('T')[0],
    retention_applied: false,
    retention_rate: 0,
    retention_amount: 0,
    subtotal: 3500000,
    total_amount: 3500000,
    status: 'draft',
    notes: 'Cotización válida por 15 días calendario.',
    clients: INITIAL_CLIENTS[1],
    document_items: [
      {
        id: 'item3',
        description: 'Consultoría e implementación de software de gestión comercial',
        quantity: 1,
        unit_price: 3500000,
        total_price: 3500000,
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
// PROFILES API
// --------------------------------------------------------------------
export async function getProfile(): Promise<Profile> {
  const currentUser = await getCurrentUser();
  if (isSupabaseConfigured() && currentUser?.id) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Error leyendo perfil en Supabase:', e);
    }
    return {
      id: currentUser.id,
      razon_social: currentUser.user_metadata?.razon_social || 'MI EMPRESA O NOMBRE COMPLETO S.A.S.',
      document_type: 'CC',
      document_number: '123456789-0',
      phone: '+57 300 123 4567',
      email: currentUser.email || 'contacto@miempresa.co',
      address: 'Calle 100 # 15-20',
      city: 'Bogotá D.C., Colombia',
      bank_name: 'Bancolombia',
      account_type: 'Ahorros',
      account_number: '123-456789-00',
      legal_text: DEFAULT_PROFILE.legal_text,
    };
  }
  const localProf = getLocal<Profile>('gst_profile', DEFAULT_PROFILE);
  if (currentUser?.email) localProf.email = currentUser.email;
  return localProf;
}

export async function saveProfile(profile: Profile): Promise<boolean> {
  const currentUser = await getCurrentUser();
  setLocal('gst_profile', profile);

  if (isSupabaseConfigured() && currentUser?.id) {
    try {
      const payload = { ...profile, id: currentUser.id };
      await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    } catch (e) {
      console.error('Error guardando perfil en Supabase:', e);
    }
  }
  return true;
}

// --------------------------------------------------------------------
// CLIENTS API
// --------------------------------------------------------------------
export async function getClients(): Promise<Client[]> {
  const currentUser = await getCurrentUser();
  if (isSupabaseConfigured()) {
    if (currentUser?.id) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .or(`user_id.eq.${currentUser.id},user_id.is.null`)
          .order('name');
        if (!error && data) return data;
      } catch (e) {
        console.warn('Error buscando clientes en Supabase:', e);
      }
    }
    return [];
  }
  return getLocal<Client[]>('gst_clients', INITIAL_CLIENTS);
}

export async function createClient(clientData: Omit<Client, 'id'>): Promise<Client> {
  const currentUser = await getCurrentUser();
  const newClient: Client = {
    id: isSupabaseConfigured() ? crypto.randomUUID() : `client-${Date.now()}`,
    ...clientData,
  };

  if (isSupabaseConfigured() && currentUser?.id) {
    try {
      const payload = { ...clientData, user_id: currentUser.id };
      const { data, error } = await supabase.from('clients').insert([payload]).select().single();
      if (!error && data) return data;
    } catch (e) {
      console.error('Error insertando cliente en Supabase:', e);
    }
  }

  const currentClients = getLocal<Client[]>('gst_clients', INITIAL_CLIENTS);
  const updated = [newClient, ...currentClients];
  setLocal('gst_clients', updated);
  return newClient;
}

// --------------------------------------------------------------------
// DOCUMENTS API
// --------------------------------------------------------------------
export async function getDocuments(): Promise<DocumentWithDetails[]> {
  const currentUser = await getCurrentUser();
  if (isSupabaseConfigured()) {
    if (currentUser?.id) {
      try {
        const { data, error } = await supabase
          .from('documents')
          .select(`
            *,
            clients (*),
            document_items (*)
          `)
          .or(`user_id.eq.${currentUser.id},user_id.is.null`)
          .order('created_at', { ascending: false });

        if (!error && data) return data as DocumentWithDetails[];
      } catch (e) {
        console.warn('Error leyendo documentos en Supabase:', e);
      }
    }
    return [];
  }
  return getLocal<DocumentWithDetails[]>('gst_documents', INITIAL_DOCUMENTS);
}

export async function getDocumentById(id: string): Promise<DocumentWithDetails | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          clients (*),
          document_items (*)
        `)
        .eq('id', id)
        .single();

      if (!error && data) return data as DocumentWithDetails;
    } catch (e) {
      console.warn('Error buscando documento en Supabase:', e);
    }
  }

  const docs = getLocal<DocumentWithDetails[]>('gst_documents', INITIAL_DOCUMENTS);
  return docs.find((d) => d.id === id) || null;
}

export async function saveDocument(
  docData: Omit<DocumentWithDetails, 'id'> & { id?: string }
): Promise<DocumentWithDetails> {
  const currentUser = await getCurrentUser();
  const isEdit = !!docData.id;
  const docId = docData.id || `doc-${Date.now()}`;

  const documentHeader = {
    user_id: currentUser?.id || undefined,
    client_id: docData.client_id,
    type: docData.type,
    number: docData.number,
    date: docData.date,
    due_date: docData.due_date,
    retention_applied: docData.retention_applied,
    retention_rate: docData.retention_rate,
    retention_amount: docData.retention_amount,
    subtotal: docData.subtotal,
    total_amount: docData.total_amount,
    status: docData.status,
    notes: docData.notes,
  };

  const items = docData.document_items || [];

  if (isSupabaseConfigured()) {
    try {
      if (isEdit) {
        await supabase.from('documents').update(documentHeader).eq('id', docId);
        await supabase.from('document_items').delete().eq('document_id', docId);
      } else {
        const { data: insertedDoc } = await supabase
          .from('documents')
          .insert([documentHeader])
          .select()
          .single();
        if (insertedDoc) docData.id = insertedDoc.id;
      }

      const itemsToInsert = items.map((it) => ({
        document_id: docData.id || docId,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.total_price,
      }));

      await supabase.from('document_items').insert(itemsToInsert);

      const fullDoc = await getDocumentById(docData.id || docId);
      if (fullDoc) return fullDoc;
    } catch (e) {
      console.error('Error guardando documento en Supabase:', e);
    }
  }

  // Fallback local
  const currentDocs = getLocal<DocumentWithDetails[]>('gst_documents', INITIAL_DOCUMENTS);
  const clients = await getClients();
  const matchedClient = clients.find((c) => c.id === docData.client_id) || null;

  const fullDoc: DocumentWithDetails = {
    id: docId,
    ...documentHeader,
    clients: matchedClient,
    document_items: items,
  };

  let updatedDocs: DocumentWithDetails[];
  if (isEdit) {
    updatedDocs = currentDocs.map((d) => (d.id === docId ? fullDoc : d));
  } else {
    updatedDocs = [fullDoc, ...currentDocs];
  }

  setLocal('gst_documents', updatedDocs);
  return fullDoc;
}

export async function updateDocumentStatus(id: string, status: DocumentWithDetails['status']): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('documents').update({ status }).eq('id', id);
    } catch (e) {
      console.error('Error actualizando estado en Supabase:', e);
    }
  }

  const currentDocs = getLocal<DocumentWithDetails[]>('gst_documents', INITIAL_DOCUMENTS);
  const updated = currentDocs.map((d) => (d.id === id ? { ...d, status } : d));
  setLocal('gst_documents', updated);
  return true;
}
