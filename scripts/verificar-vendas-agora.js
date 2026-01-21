#!/usr/bin/env node
/**
 * 🎯 Verificar vendas após correção do webhook
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

async function verificarVendas() {
  console.log('\n🔍 VERIFICANDO VENDAS APÓS CORREÇÃO...\n')
  
  // Buscar todas as vendas
  const { data: sales, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Erro:', error)
    return
  }
  
  if (!sales || sales.length === 0) {
    console.log('⚠️ Nenhuma venda encontrada')
    return
  }
  
  console.log(`✅ Total de vendas: ${sales.length}\n`)
  
  // Agrupar por status
  const approved = sales.filter(s => ['approved', 'paid', 'completed'].includes(s.status))
  const pending = sales.filter(s => s.status === 'pending')
  const others = sales.filter(s => !['approved', 'paid', 'completed', 'pending'].includes(s.status))
  
  console.log('📊 POR STATUS:')
  console.log(`   ✅ Aprovadas/Pagas: ${approved.length}`)
  console.log(`   ⏳ Pendentes: ${pending.length}`)
  console.log(`   📋 Outros: ${others.length}\n`)
  
  // Calcular total
  const totalApproved = approved.reduce((sum, s) => sum + (s.total_amount || 0), 0)
  console.log(`💰 TOTAL APROVADO: R$ ${totalApproved.toFixed(2)}\n`)
  
  // Mostrar últimas 5 vendas
  console.log('📋 ÚLTIMAS 5 VENDAS:\n')
  sales.slice(0, 5).forEach((sale, i) => {
    console.log(`${i + 1}. 🛒 Pedido #${sale.appmax_order_id || sale.id}`)
    console.log(`   👤 ${sale.customer_name || sale.customer_email || 'Sem nome'}`)
    console.log(`   💵 R$ ${(sale.total_amount || 0).toFixed(2)}`)
    console.log(`   📊 Status: ${sale.status}`)
    console.log(`   📅 ${new Date(sale.created_at).toLocaleString('pt-BR')}\n`)
  })
  
  // Verificar se order 105628437 está lá
  const order105628437 = sales.find(s => s.appmax_order_id === '105628437' || s.appmax_order_id === 105628437)
  if (order105628437) {
    console.log('✅ PEDIDO 105628437 ENCONTRADO!')
    console.log(JSON.stringify(order105628437, null, 2))
  } else {
    console.log('⚠️ Pedido 105628437 não encontrado ainda')
  }
}

verificarVendas()
