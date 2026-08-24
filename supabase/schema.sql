-- ====================================================================
-- GST COTIZACIONES & COBROS - ESQUEMA DE BASE DE DATOS CON AUTENTICACIÓN Y FIRMA
-- Normatividad Colombiana (Art. 383 E.T. / Decreto 522 de 2003)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. TABLA: PROFILES / EMISOR (Datos vinculados a auth.users + Firma)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    razon_social TEXT NOT NULL DEFAULT 'MI EMPRESA O NOMBRE COMPLETO S.A.S.',
    document_type TEXT NOT NULL DEFAULT 'CC',
    document_number TEXT NOT NULL DEFAULT '123456789-0',
    phone TEXT DEFAULT '+57 300 123 4567',
    email TEXT,
    address TEXT DEFAULT 'Calle 100 # 15-20, Oficina 401',
    city TEXT DEFAULT 'Bogotá D.C., Colombia',
    bank_name TEXT DEFAULT 'Bancolombia',
    account_type TEXT DEFAULT 'Ahorros',
    account_number TEXT DEFAULT '123-456789-00',
    legal_text TEXT DEFAULT 'Hago constar bajo la gravedad de juramento que no he contratado o vinculado dos (2) o más trabajadores o contratistas asociados a mi actividad económica por un término igual o superior a noventa (90) días continuos o discontinuos dentro del mismo año gravable (Art. 383 del Estatuto Tributario y Decreto 522 de 2003). Persona Natural No Responsable de IVA (Art. 437 Parágrafo 3 E.T.).',
    signature_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 2. TABLA: CLIENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    document_type TEXT DEFAULT 'NIT',
    document_number TEXT NOT NULL,
    address TEXT,
    email TEXT,
    phone TEXT,
    city TEXT DEFAULT 'Colombia',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 3. TABLA: DOCUMENTS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('quotation', 'bill')),
    number TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    retention_applied BOOLEAN DEFAULT false,
    retention_rate NUMERIC(5,2) DEFAULT 0.00,
    retention_amount NUMERIC(15,2) DEFAULT 0.00,
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- 4. TABLA: DOCUMENT_ITEMS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------
-- TRIGGER DE POSTGRES: CREAR PERFIL AUTOMÁTICO AL REGISTRARSE USUARIO
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, razon_social)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'razon_social', 'MI EMPRESA S.A.S.')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso por usuario a profiles" ON public.profiles;
CREATE POLICY "Acceso por usuario a profiles" ON public.profiles FOR ALL USING (auth.uid() = id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Acceso por usuario a clients" ON public.clients;
CREATE POLICY "Acceso por usuario a clients" ON public.clients FOR ALL USING (auth.uid() = user_id OR user_id IS NULL OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Acceso por usuario a documents" ON public.documents;
CREATE POLICY "Acceso por usuario a documents" ON public.documents FOR ALL USING (auth.uid() = user_id OR user_id IS NULL OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Acceso por usuario a document_items" ON public.document_items;
CREATE POLICY "Acceso por usuario a document_items" ON public.document_items FOR ALL USING (true);
