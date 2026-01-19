import { NextRequest, NextResponse } from "next/server"

/**
 * Testa diferentes URLs base da Appmax para descobrir a correta
 */
export async function GET(request: NextRequest) {
  const API_TOKEN = process.env.APPMAX_API_TOKEN

  if (!API_TOKEN) {
    return NextResponse.json({ error: 'Token não configurado' }, { status: 400 })
  }

  // Possíveis URLs base para produção
  const urlsToTest = [
    'https://api.appmax.com.br',
    'https://api-appmax.com.br',
    'https://appmax.com.br',
    'https://app.appmax.com.br',
    'https://admin.appmax.com.br',
    'https://gravadormedico1768482029857.carrinho.app',
  ]

  const results = []

  for (const baseUrl of urlsToTest) {
    try {
      const response = await fetch(`${baseUrl}/api/v3/customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'access-token': API_TOKEN,
          firstname: 'Teste',
          lastname: 'API',
          email: 'teste@teste.com',
          telephone: '11999999999',
          ip: '127.0.0.1',
        }),
      })

      const result: any = {
        baseUrl,
        endpoint: `${baseUrl}/api/v3/customer`,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      }

      try {
        const data = await response.text()
        result.response = data.substring(0, 500)
        
        try {
          result.json = JSON.parse(data)
        } catch (e) {
          // não é JSON
        }
      } catch (e) {
        result.response = 'Não foi possível ler resposta'
      }

      results.push(result)

      // Se achou uma que funciona, para
      if (response.ok) {
        break
      }
    } catch (error: any) {
      results.push({
        baseUrl,
        error: error.message,
      })
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Teste de URLs base da Appmax',
    timestamp: new Date().toISOString(),
    results,
    recommendation: results.find((r: any) => r.ok) 
      ? `✅ Use: ${results.find((r: any) => r.ok)?.baseUrl}`
      : '❌ Nenhuma URL funcionou. Entre em contato com o suporte da Appmax.',
  })
}
