/**
 * 🎯 CONFIGURAÇÃO CENTRAL DE PRODUTOS
 * ====================================
 * 
 * FONTE ÚNICA DE VERDADE para produtos em todos os gateways
 * 
 * - Mercado Pago: Usa apenas o valor (amount)
 * - Appmax: Usa o appmax_product_id
 * 
 * Este arquivo mantém os produtos sincronizados entre:
 * 1. Checkout (frontend)
 * 2. API de pagamento (cascata)
 * 3. Painel admin
 * 4. Webhooks
 */

export type ProductType = 'main' | 'bump' | 'upsell'
export type ProductCategory = 'subscription' | 'one_time' | 'service' | 'bump'

export interface Product {
  id: string                    // ID interno (UUID ou slug)
  sku: string                   // SKU único para referência
  name: string                  // Nome do produto
  description: string           // Descrição
  price: number                 // Preço em reais
  originalPrice?: number        // Preço original (para mostrar desconto)
  type: ProductType             // main, bump ou upsell
  category: ProductCategory     // Categoria
  appmax_product_id: string     // ID do produto na Appmax
  appmax_checkout_url?: string  // URL do checkout na Appmax (se houver)
  is_active: boolean            // Se está ativo para venda
  is_featured: boolean          // Se aparece em destaque
  order: number                 // Ordem de exibição
  image_url?: string            // Imagem do produto
  features?: string[]           // Lista de features/benefícios
}

// =====================================================
// 📦 PRODUTOS PRINCIPAIS
// =====================================================
export const MAIN_PRODUCTS: Product[] = [
  {
    id: 'gravador-medico-vitalicio',
    sku: 'GRAV-MAIN-001',
    name: 'Gravador Médico - Acesso Vitalício',
    description: 'Acesso completo e vitalício ao Gravador Médico com todas as funcionalidades',
    price: 36.00,
    originalPrice: 97.00,
    type: 'main',
    category: 'one_time',
    appmax_product_id: '32991339',
    appmax_checkout_url: 'https://gravadormedico1768482029857.carrinho.app/one-checkout/ocudf/32991339',
    is_active: true,
    is_featured: true,
    order: 1,
    features: [
      'Acesso vitalício',
      'Transcrição automática de consultas',
      'Prontuários inteligentes',
      'Sem mensalidades',
    ],
  },
]

// =====================================================
// 🎁 ORDER BUMPS (Ofertas adicionais no checkout)
// =====================================================
export const ORDER_BUMPS: Product[] = [
  {
    id: 'conteudo-infinito-instagram',
    sku: 'BUMP-001',
    name: 'Conteúdo Infinito para Instagram',
    description: 'Templates e ideias infinitas para seu Instagram médico',
    price: 29.90,
    originalPrice: 97.00,
    type: 'bump',
    category: 'bump',
    appmax_product_id: '32989468',
    is_active: true,
    is_featured: false,
    order: 1,
    features: [
      '100+ templates prontos',
      'Calendário de conteúdo',
      'Scripts para Reels',
    ],
  },
  {
    id: 'implementacao-assistida',
    sku: 'BUMP-002',
    name: 'Implementação Assistida',
    description: 'Suporte dedicado para configurar tudo para você',
    price: 97.00,
    originalPrice: 297.00,
    type: 'bump',
    category: 'bump',
    appmax_product_id: '32989503',
    is_active: true,
    is_featured: false,
    order: 2,
    features: [
      'Configuração completa',
      'Suporte 1:1',
      'Integração personalizada',
    ],
  },
  {
    id: 'analise-inteligente',
    sku: 'BUMP-003',
    name: 'Análise Inteligente de Consultas',
    description: 'IA avançada para análise de consultas e insights',
    price: 39.90,
    originalPrice: 147.00,
    type: 'bump',
    category: 'bump',
    appmax_product_id: '32989520',
    is_active: true,
    is_featured: false,
    order: 3,
    features: [
      'Análise por IA',
      'Relatórios automáticos',
      'Insights de pacientes',
    ],
  },
]

// =====================================================
// 📊 TODOS OS PRODUTOS (para fácil acesso)
// =====================================================
export const ALL_PRODUCTS: Product[] = [...MAIN_PRODUCTS, ...ORDER_BUMPS]

// =====================================================
// 🔧 FUNÇÕES UTILITÁRIAS
// =====================================================

/**
 * Busca produto pelo ID interno (slug)
 */
export function getProductById(id: string): Product | undefined {
  return ALL_PRODUCTS.find(p => p.id === id)
}

/**
 * Busca produto pelo SKU
 */
export function getProductBySku(sku: string): Product | undefined {
  return ALL_PRODUCTS.find(p => p.sku === sku)
}

/**
 * Busca produto pelo ID da Appmax
 */
export function getProductByAppmaxId(appmaxId: string): Product | undefined {
  return ALL_PRODUCTS.find(p => p.appmax_product_id === appmaxId)
}

/**
 * Retorna o produto principal ativo
 */
export function getMainProduct(): Product {
  const main = MAIN_PRODUCTS.find(p => p.is_active)
  if (!main) throw new Error('Nenhum produto principal ativo')
  return main
}

/**
 * Retorna todos os order bumps ativos
 */
export function getActiveOrderBumps(): Product[] {
  return ORDER_BUMPS.filter(p => p.is_active).sort((a, b) => a.order - b.order)
}

/**
 * Calcula total de uma compra com bumps selecionados
 */
export function calculateOrderTotal(selectedBumpIds: string[]): {
  mainProduct: Product
  bumps: Product[]
  subtotal: number
  bumpsTotal: number
  total: number
} {
  const mainProduct = getMainProduct()
  const bumps = selectedBumpIds
    .map(id => getProductById(id) || getProductByAppmaxId(id))
    .filter((p): p is Product => p !== undefined)
  
  const bumpsTotal = bumps.reduce((sum, b) => sum + b.price, 0)
  const subtotal = mainProduct.price
  const total = subtotal + bumpsTotal
  
  return {
    mainProduct,
    bumps,
    subtotal,
    bumpsTotal,
    total,
  }
}

/**
 * Prepara dados para enviar para API de checkout
 */
export function prepareCheckoutData(selectedBumpIds: string[]) {
  const { mainProduct, bumps, total } = calculateOrderTotal(selectedBumpIds)
  
  return {
    // Para Mercado Pago (só precisa do valor total)
    amount: total,
    description: bumps.length > 0 
      ? `${mainProduct.name} + ${bumps.length} adicional(is)`
      : mainProduct.name,
    
    // Para Appmax (precisa dos IDs)
    mainProductId: mainProduct.appmax_product_id,
    orderBumps: bumps.map(b => ({
      product_id: b.appmax_product_id,
      quantity: 1,
    })),
    
    // Detalhes para registro
    items: [
      {
        sku: mainProduct.sku,
        name: mainProduct.name,
        price: mainProduct.price,
        type: 'main' as const,
      },
      ...bumps.map(b => ({
        sku: b.sku,
        name: b.name,
        price: b.price,
        type: 'bump' as const,
      })),
    ],
  }
}

/**
 * Mapeamento de ID Appmax para preço (compatibilidade legada)
 */
export const APPMAX_PRICES: Record<string, number> = ALL_PRODUCTS.reduce(
  (acc, p) => ({ ...acc, [p.appmax_product_id]: p.price }),
  {}
)

/**
 * Mapeamento de ID Appmax para nome (compatibilidade legada)
 */
export const APPMAX_PRODUCT_NAMES: Record<string, string> = ALL_PRODUCTS.reduce(
  (acc, p) => ({ ...acc, [p.appmax_product_id]: p.name }),
  {}
)

// =====================================================
// 📤 EXPORTS PARA VARIÁVEIS DE AMBIENTE
// =====================================================
// Esses valores podem ser sobrescritos por env vars se necessário

export const ENV_PRODUCT_IDS = {
  MAIN: process.env.APPMAX_PRODUCT_ID || MAIN_PRODUCTS[0].appmax_product_id,
  BUMP_1: process.env.APPMAX_ORDER_BUMP_1_ID || ORDER_BUMPS[0].appmax_product_id,
  BUMP_2: process.env.APPMAX_ORDER_BUMP_2_ID || ORDER_BUMPS[1].appmax_product_id,
  BUMP_3: process.env.APPMAX_ORDER_BUMP_3_ID || ORDER_BUMPS[2].appmax_product_id,
}
