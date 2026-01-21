-- ============================================
-- 🔧 CORREÇÃO COMPLETA DO DASHBOARD ADMIN
-- ============================================

-- 1. CRIAR/ATUALIZAR TABELA DE PRODUTOS
-- Primeiro verificar se a tabela existe e adicionar colunas que faltam
DO $$ 
BEGIN
  -- Criar tabela se não existir
  CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  -- Adicionar colunas que podem não existir
  BEGIN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS appmax_product_id TEXT UNIQUE;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS appmax_sku TEXT;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
END $$;

-- 2. CRIAR TABELA DE ANALYTICS (se não existe)
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    event_data JSONB,
    user_id TEXT,
    session_id TEXT,
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- 3. ADICIONAR CAMPOS FALTANTES EM checkout_attempts
DO $$
BEGIN
  BEGIN
    ALTER TABLE checkout_attempts ADD COLUMN IF NOT EXISTS product_id UUID;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE checkout_attempts ADD COLUMN IF NOT EXISTS abandoned_at TIMESTAMPTZ;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE checkout_attempts ADD COLUMN IF NOT EXISTS recovered_at TIMESTAMPTZ;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE checkout_attempts ADD COLUMN IF NOT EXISTS cart_value DECIMAL(10,2);
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
  
  -- Adicionar foreign key se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'checkout_attempts_product_id_fkey'
  ) THEN
    ALTER TABLE checkout_attempts 
      ADD CONSTRAINT checkout_attempts_product_id_fkey 
      FOREIGN KEY (product_id) REFERENCES products(id);
  END IF;
END $$;

-- 4. POPULAR PRODUTOS COM OS DADOS DA APPMAX
-- Produto principal: Gravador Médico
DO $$
BEGIN
  -- Verificar se já existe antes de inserir
  IF NOT EXISTS (SELECT 1 FROM products WHERE appmax_product_id = '30495032') THEN
    INSERT INTO products (
      name, 
      sku,
      description, 
      price, 
      appmax_product_id, 
      appmax_sku,
      active,
      stock
    ) VALUES (
      'Gravador Médico - Acesso Vitalício',
      '32991339',
      'Sistema completo de gravação e transcrição de consultas médicas com IA',
      36.00,
      '30495032',
      '32991339',
      true,
      9999
    );
  ELSE
    -- Atualizar se já existir
    UPDATE products SET
      name = 'Gravador Médico - Acesso Vitalício',
      sku = '32991339',
      description = 'Sistema completo de gravação e transcrição de consultas médicas com IA',
      price = 36.00,
      appmax_sku = '32991339',
      active = true,
      stock = 9999,
      updated_at = NOW()
    WHERE appmax_product_id = '30495032';
  END IF;
END $$;

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
DO $$
BEGIN
  -- Criar índices apenas se não existirem
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_status') THEN
    CREATE INDEX idx_sales_status ON sales(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_created_at') THEN
    CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sales_appmax_order_id') THEN
    CREATE INDEX idx_sales_appmax_order_id ON sales(appmax_order_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_email') THEN
    CREATE INDEX idx_customers_email ON customers(email);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_analytics_event_type') THEN
    CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_analytics_created_at') THEN
    CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_webhooks_endpoint') THEN
    CREATE INDEX idx_webhooks_endpoint ON webhooks_logs(endpoint);
  END IF;
END $$;

-- 6. CRIAR VIEW PARA RELATÓRIOS
CREATE OR REPLACE VIEW sales_report AS
SELECT 
  s.id,
  s.appmax_order_id,
  s.customer_name,
  s.customer_email,
  s.total_amount,
  s.status,
  s.payment_method,
  s.created_at::date as sale_date,
  DATE_TRUNC('month', s.created_at) as sale_month,
  DATE_TRUNC('week', s.created_at) as sale_week,
  c.name as customer_full_name,
  c.phone as customer_phone
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
WHERE s.status IN ('approved', 'paid', 'completed');

-- 7. FUNÇÃO PARA ATUALIZAR TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. TRIGGERS PARA AUTO-UPDATE
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE products IS 'Produtos disponíveis no sistema';
COMMENT ON TABLE analytics_events IS 'Eventos de analytics e tracking';
COMMENT ON VIEW sales_report IS 'Relatório consolidado de vendas';

-- 10. GRANT PERMISSIONS (se necessário)
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

SELECT '✅ Dashboard corrigido e populado com sucesso!' as status;
