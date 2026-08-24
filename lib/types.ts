export type DocumentType = 'quotation' | 'bill';

export type DocumentStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

export interface Profile {
  id?: string;
  razon_social: string;
  document_type: string;
  document_number: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  bank_name: string;
  account_type: string;
  account_number: string;
  legal_text: string;
  signature_url?: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  name: string;
  document_type: string;
  document_number: string;
  address?: string;
  email?: string;
  phone?: string;
  city?: string;
  created_at?: string;
}

export interface DocumentItem {
  id?: string;
  document_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface DocumentHeader {
  id: string;
  client_id: string;
  type: DocumentType;
  number: string;
  date: string;
  due_date?: string;
  retention_applied: boolean;
  retention_rate: number;
  retention_amount: number;
  subtotal: number;
  total_amount: number;
  status: DocumentStatus;
  notes?: string;
  created_at?: string;
}

export interface DocumentWithDetails extends DocumentHeader {
  clients?: Client | null;
  document_items?: DocumentItem[];
}

export type PrintMode = 'carta' | 'ticket';
