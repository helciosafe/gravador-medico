/**
 * =============================================
 * TYPES - Analytics & Dashboard
 * =============================================
 * TypeScript types para todas as Views SQL
 * e estruturas de dados do Analytics
 * =============================================
 */

// ========================================
// ANALYTICS VIEWS
// ========================================

/**
 * View: analytics_health
 * Métricas principais do dashboard com comparação de períodos
 */
export interface AnalyticsHealth {
  unique_visitors: number
  sales: number
  revenue: number
  average_order_value: number
  avg_time_seconds: number
  conversion_rate: number
  visitors_change: number
  revenue_change: number
  aov_change: number
  time_change: number
}

/**
 * View: marketing_attribution
 * Atribuição de receita por fonte de tráfego
 */
export interface MarketingAttribution {
  source: string
  medium: string
  campaign: string
  visitors: number
  sessions: number
  sales_count: number
  total_revenue: number
  conversion_rate: number
  average_order_value: number
  primary_device: 'mobile' | 'tablet' | 'desktop'
}

/**
 * View: product_performance
 * Performance de vendas por produto
 */
export interface ProductPerformance {
  product_name: string
  product_sku: string
  total_revenue: number
  total_quantity: number
  total_orders: number
  avg_price: number
  conversion_rate: number
}

/**
 * View: analytics_visitors_online
 * Visitantes online em tempo real (últimos 5 minutos)
 */
export interface AnalyticsVisitorsOnline {
  online_count: number
  mobile_count: number
  desktop_count: number
}

/**
 * View: analytics_funnel
 * Funil de conversão (visitantes → compra)
 */
export interface AnalyticsFunnel {
  step_visitors: number
  step_interested: number
  step_checkout_started: number
  step_purchased: number
}

// ========================================
// ANALYTICS VISITS (Tabela Raw)
// ========================================

export interface AnalyticsVisit {
  id?: string
  session_id: string
  page_path: string
  last_seen: string
  is_online: boolean
  created_at?: string
  user_agent?: string
  device_type?: 'mobile' | 'tablet' | 'desktop'
  referrer_domain?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

// ========================================
// DASHBOARD PROPS
// ========================================

/**
 * Props para o componente BigNumbers
 */
export interface BigNumbersMetrics {
  revenue: number
  sales: number
  conversion_rate: number
  average_order_value: number
  revenue_change: number
  aov_change: number
  visitors_change: number
  time_change: number
}

// ========================================
// QUERY RESPONSES
// ========================================

export interface QueryResponse<T> {
  data: T | null
  error: any
}

export interface QueryArrayResponse<T> {
  data: T[]
  error: any
}

// ========================================
// CUSTOMER & SALES (Views Existentes)
// ========================================

export interface CustomerSalesSummary {
  customer_id: string
  name: string
  email: string
  phone?: string
  total_spent: number
  total_orders: number
  average_order_value: number
  last_purchase_at: string
  first_purchase_at: string
  ltv: number
}

export interface ProductSalesSummary {
  product_id?: string
  product_name: string
  product_sku: string
  total_revenue: number
  total_quantity: number
  total_orders: number
  avg_price: number
}

export interface SalesByDay {
  sale_date: string
  total_sales: number
  total_revenue: number
  avg_ticket: number
}

export interface SalesBySource {
  source: string
  total_sales: number
  total_revenue: number
  avg_ticket: number
  first_sale: string
  last_sale: string
}

// ========================================
// CRM TYPES
// ========================================

export interface CRMContact {
  id: string
  customer_id?: string
  name: string
  email: string
  phone?: string
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  source?: string
  tags?: string[]
  notes?: string
  created_at: string
  updated_at: string
  assigned_to?: string
}

export interface CRMActivity {
  id: string
  contact_id: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  description: string
  created_at: string
  created_by?: string
}

export interface CRMFunnelSummary {
  stage: string
  count: number
  total_value: number
  avg_value: number
}

// ========================================
// UTILITY TYPES
// ========================================

export type DeviceType = 'mobile' | 'tablet' | 'desktop'
export type UTMParams = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

export type DateRange = {
  startIso: string
  endIso: string
}
