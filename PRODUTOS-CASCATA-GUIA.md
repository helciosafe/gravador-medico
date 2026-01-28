# 🎯 Sistema de Produtos - Mercado Pago + Appmax (Cascata)

## 📊 Como Funciona

```
┌─────────────────────────────────────────────────────────────┐
│                    CHECKOUT DO CLIENTE                       │
│                                                              │
│  Produto Principal: R$ 36,00                                │
│  ☑️ Order Bump 1: +R$ 29,90                                  │
│  ☐ Order Bump 2: +R$ 97,00                                  │
│  ☑️ Order Bump 3: +R$ 39,90                                  │
│                                                              │
│  TOTAL: R$ 105,80                                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              lib/products-config.ts                          │
│              (Fonte única de verdade)                        │
│                                                              │
│  • Calcula total                                            │
│  • Prepara dados para cada gateway                          │
│  • Mapeia IDs internos ↔ IDs Appmax                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              /api/checkout/cascade                           │
└─────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│    MERCADO PAGO         │   │       APPMAX            │
│    (PRINCIPAL)          │   │      (FALLBACK)         │
│                         │   │                         │
│  ✅ NÃO precisa criar   │   │  ⚠️ PRECISA criar       │
│     produto lá          │   │     produto lá          │
│                         │   │                         │
│  Envia:                 │   │  Envia:                 │
│  • amount: 105.80       │   │  • product_id: 32991339 │
│  • description: "..."   │   │  • order_bumps: [...]   │
│  • token do cartão      │   │  • token do cartão      │
└─────────────────────────┘   └─────────────────────────┘
              │                         │
              └────────────┬────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS                            │
│                                                              │
│  orders: { gateway: 'mercadopago' | 'appmax', amount, ... } │
│  sales_items: { product_name, price, type: 'main'|'bump' }  │
│  products: { appmax_product_id, price, category, ... }      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Produtos Cadastrados

| Tipo | Nome | Preço | ID Appmax |
|------|------|-------|-----------|
| **Main** | Gravador Médico - Acesso Vitalício | R$ 36,00 | 32991339 |
| Bump 1 | Conteúdo Infinito para Instagram | R$ 29,90 | 32989468 |
| Bump 2 | Implementação Assistida | R$ 97,00 | 32989503 |
| Bump 3 | Análise Inteligente de Consultas | R$ 39,90 | 32989520 |

---

## 🔧 Arquivos Importantes

### 1. `lib/products-config.ts`
Configuração central de todos os produtos. Use este arquivo para:
- Adicionar novos order bumps
- Alterar preços
- Ativar/desativar produtos

```typescript
import { getMainProduct, getActiveOrderBumps, calculateOrderTotal } from '@/lib/products-config'

// Pegar produto principal
const main = getMainProduct() // { name, price, appmax_product_id, ... }

// Pegar bumps ativos
const bumps = getActiveOrderBumps() // Array de bumps

// Calcular total com bumps selecionados
const { total, items } = calculateOrderTotal(['conteudo-infinito-instagram', 'analise-inteligente'])
// total = 105.80
```

### 2. `database/PRODUTOS-CADASTRO.sql`
Script para cadastrar os produtos no Supabase. Execute no SQL Editor do Supabase.

### 3. `/api/checkout/cascade`
API que processa pagamentos:
1. Tenta **Mercado Pago** primeiro
2. Se falhar, usa **Appmax** como backup

---

## 🚀 Como Adicionar Novo Order Bump

### Passo 1: Criar na Appmax (obrigatório para fallback)
1. Acesse admin.appmax.com.br
2. Crie novo produto
3. Anote o **ID do produto** (ex: 32989999)

### Passo 2: Adicionar no código

**Em `lib/products-config.ts`:**
```typescript
export const ORDER_BUMPS: Product[] = [
  // ... bumps existentes
  {
    id: 'novo-bump',
    sku: 'BUMP-004',
    name: 'Nome do Novo Bump',
    description: 'Descrição...',
    price: 49.90,
    type: 'bump',
    category: 'bump',
    appmax_product_id: '32989999', // ID da Appmax
    is_active: true,
    is_featured: false,
    order: 4,
  },
]
```

### Passo 3: Cadastrar no banco (opcional, para relatórios)
Execute SQL similar ao `database/PRODUTOS-CADASTRO.sql`

---

## ❓ Perguntas Frequentes

### Por que preciso criar produto na Appmax se o Mercado Pago é o principal?

**R:** A Appmax é seu **fallback** (backup). Se o Mercado Pago falhar por qualquer motivo:
- Cartão recusado
- API fora do ar
- Timeout

O sistema automaticamente tenta processar na Appmax. Para isso funcionar, os produtos precisam existir lá.

### Posso ter preços diferentes entre gateways?

**Sim**, mas não recomendado. O cliente vê um preço no checkout. Se você cobrar valor diferente no fallback, pode gerar confusão.

### Como o painel admin/products funciona?

Ele lê da tabela `products` do Supabase. Execute o SQL para popular os produtos e eles aparecerão lá.

### E se eu quiser desativar um order bump?

Em `lib/products-config.ts`, mude `is_active: false` no bump desejado.

---

## 📊 Fluxo de Pagamento Detalhado

```
1. Cliente preenche checkout
   └─→ Frontend calcula total usando products-config.ts

2. Cliente clica "Pagar"
   └─→ Frontend tokeniza cartão no Mercado Pago
   └─→ Envia para /api/checkout/cascade

3. API recebe requisição
   └─→ Valida dados (CPF, email, etc)
   └─→ Cria registro na tabela 'orders' (status: pending)

4. Tenta Mercado Pago (primário)
   ├─→ ✅ Aprovado: Atualiza order, libera acesso
   └─→ ❌ Recusado: Segue para fallback

5. Tenta Appmax (fallback)
   ├─→ ✅ Aprovado: Atualiza order, libera acesso
   └─→ ❌ Recusado: Retorna erro ao cliente

6. Registra tentativas
   └─→ Tabela 'payment_attempts' com histórico
```

---

## ✅ Checklist de Configuração

- [ ] Executar `database/PRODUTOS-CADASTRO.sql` no Supabase
- [ ] Verificar que produtos aparecem em `/admin/products`
- [ ] Confirmar IDs da Appmax nas variáveis de ambiente
- [ ] Testar checkout com cartão de teste
- [ ] Verificar fallback funcionando (simular erro MP)
