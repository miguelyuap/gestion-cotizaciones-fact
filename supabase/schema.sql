-- ====================================================================
-- GST COTIZACIONES & COBROS - ESQUEMA COMPLETO DE BASE DE DATOS SUPABASE
-- Normatividad Colombiana (Art. 383 E.T. / Decreto 522 de 2003)
-- Ejecutar en el SQL Editor de Supabase (https://supabase.com/dashboard)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. TABLA: PROFILES / EMISOR (Datos vinculados a auth.users + Firma)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    razon_social TEXT NOT NULL DEFAULT 'MI EMPRESA O NOMBRE COMPLETO S.A.S.',
    document_type TEXT NOT NULL DEFAULT 'CC',
    document_number TEXT NOT NULL DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT,
    address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    bank_name TEXT DEFAULT 'Bancolombia',
    account_type TEXT DEFAULT 'Ahorros',
    account_number TEXT DEFAULT '',
    legal_text TEXT DEFAULT 'Hago constar bajo la gravedad de juramento que no he contratado o vinculado dos (2) o más trabajadores o contratistas asociados a mi actividad económica por un término igual o superior a noventa (90) días continuos o discontinuos dentro del mismo año gravable (Art. 383 del Estatuto Tributario y Decreto 522 de 2003). Persona Natural No Responsable de IVA (Art. 437 Parágrafo 3 E.T.).',
    signature_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Asegurar columnas si la tabla ya existía de migraciones anteriores
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS razon_social TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT 'CC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document_number TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT 'Bancolombia';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'Ahorros';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_number TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS legal_text TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- --------------------------------------------------------------------
-- 2. TABLA: CLIENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document_type TEXT DEFAULT 'NIT',
    document_number TEXT NOT NULL DEFAULT '0',
    address TEXT,
    email TEXT,
    phone TEXT,
    city TEXT DEFAULT 'Colombia',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Asegurar columnas en clientes si la tabla ya existía
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'NIT';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Colombia';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- --------------------------------------------------------------------
-- 3. TABLA: DOCUMENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('quotation', 'bill')),
    number TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    discount_rate NUMERIC(5,2) DEFAULT 0.00,
    discount_amount NUMERIC(15,2) DEFAULT 0.00,
    tax_rate NUMERIC(5,2) DEFAULT 0.00,
    tax_amount NUMERIC(15,2) DEFAULT 0.00,
    retention_applied BOOLEAN DEFAULT false,
    retention_rate NUMERIC(5,2) DEFAULT 0.00,
    retention_amount NUMERIC(15,2) DEFAULT 0.00,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    amount_in_words TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Asegurar columnas críticas en documents si la tabla ya existía
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS amount_in_words TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS retention_applied BOOLEAN DEFAULT false;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS retention_rate NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS retention_amount NUMERIC(15,2) DEFAULT 0.00;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS notes TEXT;

-- --------------------------------------------------------------------
-- 4. TABLA: DOCUMENT_ITEMS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount_rate NUMERIC(5,2) DEFAULT 0.00,
    tax_rate NUMERIC(5,2) DEFAULT 0.00,
    total_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.document_items ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE;
ALTER TABLE public.document_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.document_items ADD COLUMN IF NOT EXISTS quantity NUMERIC(10,2) DEFAULT 1;
ALTER TABLE public.document_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(15,2) DEFAULT 0.00;
ALTER TABLE public.document_items ADD COLUMN IF NOT EXISTS total_price NUMERIC(15,2) DEFAULT 0.00;

-- --------------------------------------------------------------------
-- TRIGGER DE POSTGRES: CREAR PERFIL AUTOMÁTICO AL REGISTRARSE USUARIO
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    razon_social,
    document_type,
    document_number,
    phone,
    address,
    city
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'razon_social', ''),
    COALESCE(new.raw_user_meta_data->>'document_type', 'CC'),
    COALESCE(new.raw_user_meta_data->>'document_number', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'address', ''),
    COALESCE(new.raw_user_meta_data->>'city', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    razon_social = COALESCE(NULLIF(EXCLUDED.razon_social, ''), public.profiles.razon_social),
    document_type = COALESCE(NULLIF(EXCLUDED.document_type, ''), public.profiles.document_type),
    document_number = COALESCE(NULLIF(EXCLUDED.document_number, ''), public.profiles.document_number),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    address = COALESCE(NULLIF(EXCLUDED.address, ''), public.profiles.address),
    city = COALESCE(NULLIF(EXCLUDED.city, ''), public.profiles.city);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------------------------------
-- RLS POLICIES (POLÍTICAS DE SEGURIDAD ESTRICTAS POR USUARIO EN SUPABASE)
-- --------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso por usuario a profiles" ON public.profiles;
CREATE POLICY "Acceso por usuario a profiles" ON public.profiles 
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Acceso por usuario a clients" ON public.clients;
CREATE POLICY "Acceso por usuario a clients" ON public.clients 
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Acceso por usuario a documents" ON public.documents;
CREATE POLICY "Acceso por usuario a documents" ON public.documents 
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Acceso por usuario a document_items" ON public.document_items;
CREATE POLICY "Acceso por usuario a document_items" ON public.document_items 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_items.document_id AND d.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_items.document_id AND d.user_id = auth.uid()
    )
  );
