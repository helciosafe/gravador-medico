#!/usr/bin/env node
/**
 * 🔍 Diagnóstico Completo do Dashboard Admin
 * Verifica todas as tabelas e dados necessários
 */

const fs = require('fs')
const path = require('path')

// Ler .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length) {
    process.env[key.trim()] = valueParts.join('=').trim()
  }
})

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function diagnosticoCompleto() {
  console.log('\n🔍 DIAGNÓSTICO COMPLETO DO DASHBOARD ADMIN\n')
  console.log('═'.repeat(60))
  
  // 1. VENDAS (sales)
  console.log('\n📊 1. VENDAS (sales)')
  console.log('─'.repeat(60))
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (salesError) {
    console.log('❌ Erro:', salesError.message)
  } else {
    console.log(`✅ Total de vendas: ${sales?.length || 0}`)
    if (sales && sales.length > 0) {
      console.log('📋 Exemplo de venda:')
      console.log(JSON.stringify(sales[0], null, 2))
    }
  }
  
  // 2. CLIENTES (customers)
  console.log('\n👥 2. CLIENTES (customers)')
  console.log('─'.repeat(60))
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .limit(5)
  
  if (customersError) {
    console.log('❌ Erro:', customersError.message)
  } else {
    console.log(`✅ Total de clientes: ${customers?.length || 0}`)
    if (customers && customers.length > 0) {
      console.log('📋 Exemplo de cliente:')
      console.log(JSON.stringify(customers[0], null, 2))
    }
  }
  
  // 3. PRODUTOS (products)
  console.log('\n📦 3. PRODUTOS (products)')
  console.log('─'.repeat(60))
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .limit(5)
  
  if (productsError) {
    console.log('❌ Erro:', productsError.message)
    console.log('⚠️ Tabela products pode não existir')
  } else {
    console.log(`✅ Total de produtos: ${products?.length || 0}`)
    if (products && products.length > 0) {
      console.log('📋 Exemplo de produto:')
      console.log(JSON.stringify(products[0], null, 2))
    }
  }
  
  // 4. CARRINHOS ABANDONADOS (checkout_attempts)
  console.log('\n🛒 4. CARRINHOS ABANDONADOS (checkout_attempts)')
  console.log('─'.repeat(60))
  const { data: carts, error: cartsError } = await supabase
    .from('checkout_attempts')
    .select('*')
    .limit(5)
  
  if (cartsError) {
    console.log('❌ Erro:', cartsError.message)
  } else {
    console.log(`✅ Total de tentativas: ${carts?.length || 0}`)
    if (carts && carts.length > 0) {
      console.log('📋 Exemplo de carrinho:')
      console.log(JSON.stringify(carts[0], null, 2))
    }
  }
  
  // 5. WEBHOOKS (webhooks_logs)
  console.log('\n🔔 5. WEBHOOKS (webhooks_logs)')
  console.log('─'.repeat(60))
  const { data: webhooks, error: webhooksError } = await supabase
    .from('webhooks_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (webhooksError) {
    console.log('❌ Erro:', webhooksError.message)
  } else {
    console.log(`✅ Total de webhooks: ${webhooks?.length || 0}`)
    if (webhooks && webhooks.length > 0) {
      console.log('📋 Último webhook:')
      console.log(JSON.stringify(webhooks[0], null, 2))
    }
  }
  
  // 6. ANALYTICS (analytics_events)
  console.log('\n📈 6. ANALYTICS (analytics_events)')
  console.log('─'.repeat(60))
  const { data: analytics, error: analyticsError } = await supabase
    .from('analytics_events')
    .select('*')
    .limit(5)
  
  if (analyticsError) {
    console.log('❌ Erro:', analyticsError.message)
    console.log('⚠️ Tabela analytics_events pode não existir')
  } else {
    console.log(`✅ Total de eventos: ${analytics?.length || 0}`)
  }
  
  console.log('\n═'.repeat(60))
  console.log('\n✅ DIAGNÓSTICO CONCLUÍDO\n')
}

diagnosticoCompleto()
