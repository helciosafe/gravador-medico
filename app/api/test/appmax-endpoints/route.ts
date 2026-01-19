import { NextRequest, NextResponse } from "next/server"

/**
 * Testa diferentes endpoints da API Appmax para descobrir a estrutura correta
 */
export async function GET(request: NextRequest) {
  const API_URL = process.env.APPMAX_API_URL || 'https://api.appmax.com.br'
  const API_TOKEN = process.env.APPMAX_API_TOKEN
  const PRODUCT_ID = process.env.APPMAX_PRODUCT_ID

  if (!API_TOKEN) {
    return NextResponse.json({ error: 'Token não configurado' }, { status: 400 })
  }

  // Endpoints comuns para testar
  const endpointsToTest = [
    { path: '/', name: 'Root' },
    { path: '/health', name: 'Health Check' },
    { path: '/api', name: 'API Root' },
    { path: '/v1', name: 'V1 Root' },
    { path: '/v1/orders', name: 'Orders Endpoint' },
    { path: '/v1/products', name: 'Products List' },
    { path: `/v1/products/${PRODUCT_ID}`, name: 'Specific Product' },
    { path: '/v1/me', name: 'Account Info' },
    { path: '/v1/auth', name: 'Auth Endpoint' },
  ]

  const results = []

  for (const endpoint of endpointsToTest) {
    try {
      // Testa com token no header Authorization simples
      const response = await fetch(`${API_URL}${endpoint.path}`, {
        headers: {
          'Authorization': API_TOKEN,
          'Content-Type': 'application/json',
        },
      })

      const result: any = {
        endpoint: endpoint.path,
        name: endpoint.name,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      }

      try {
        const text = await response.text()
        result.response = text.substring(0, 500)
        
        // Tenta parsear como JSON
        try {
          result.json = JSON.parse(text)
        } catch (e) {
          result.json = null
        }
      } catch (e) {
        result.response = 'Não foi possível ler resposta'
      }

      results.push(result)
    } catch (error: any) {
      results.push({
        endpoint: endpoint.path,
        name: endpoint.name,
        error: error.message,
      })
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Teste de endpoints Appmax',
    timestamp: new Date().toISOString(),
    apiUrl: API_URL,
    results,
    suggestion: 'Procure por endpoints que retornam status diferente de 403 ou que dão mensagens diferentes',
  })
}
