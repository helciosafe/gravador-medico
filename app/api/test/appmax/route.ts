import { NextRequest, NextResponse } from "next/server"

/**
 * Rota de teste para validar a conexão com a API da Appmax
 * Acesse: http://localhost:3000/api/test/appmax
 */
export async function GET(request: NextRequest) {
  try {
    const API_URL = process.env.APPMAX_API_URL || 'https://api.appmax.com.br'
    const API_TOKEN = process.env.APPMAX_API_TOKEN
    const PRODUCT_ID = process.env.APPMAX_PRODUCT_ID
    const ORDER_BUMP_1 = process.env.APPMAX_ORDER_BUMP_1_ID
    const ORDER_BUMP_2 = process.env.APPMAX_ORDER_BUMP_2_ID
    const ORDER_BUMP_3 = process.env.APPMAX_ORDER_BUMP_3_ID
    const WEBHOOK_URL = process.env.APPMAX_WEBHOOK_URL
    const WEBHOOK_SECRET = process.env.APPMAX_WEBHOOK_SECRET

    // Verifica configurações
    const config = {
      apiUrl: API_URL,
      hasToken: !!API_TOKEN,
      token: API_TOKEN ? `${API_TOKEN.substring(0, 8)}...${API_TOKEN.substring(API_TOKEN.length - 4)}` : 'NÃO CONFIGURADO',
      productId: PRODUCT_ID || 'NÃO CONFIGURADO',
      orderBumps: {
        bump1: ORDER_BUMP_1 || 'NÃO CONFIGURADO',
        bump2: ORDER_BUMP_2 || 'NÃO CONFIGURADO',
        bump3: ORDER_BUMP_3 || 'NÃO CONFIGURADO',
      },
      webhook: {
        url: WEBHOOK_URL || 'NÃO CONFIGURADO',
        hasSecret: !!WEBHOOK_SECRET,
      },
    }

    // Testa conexão com a API (se houver token)
    let apiTest: any = null
    if (API_TOKEN) {
      // O token B6C99C65-4FAE30A5-BB3DFD79-CCEDE0B7 parece ter 4 partes
      // Vamos testar diferentes combinações
      const tokenParts = API_TOKEN.split('-')
      
      const authFormats = [
        { 
          name: 'Token direto no header', 
          headers: { 'x-api-token': API_TOKEN } as Record<string, string> 
        },
        { 
          name: 'Token como access-token', 
          headers: { 'access-token': API_TOKEN } as Record<string, string> 
        },
        { 
          name: 'Token no query string',
          url: `${API_URL}/v1/products/${PRODUCT_ID}?access_token=${API_TOKEN}`,
          headers: {} as Record<string, string>
        },
        { 
          name: 'Token no query string (api_key)',
          url: `${API_URL}/v1/products/${PRODUCT_ID}?api_key=${API_TOKEN}`,
          headers: {} as Record<string, string>
        },
        { 
          name: 'Primeira parte como Access Key', 
          headers: { 
            'x-access-key': tokenParts[0],
            'x-secret-key': tokenParts.slice(1).join('-')
          } as Record<string, string> 
        },
        { 
          name: 'Duas primeiras partes como Access Key',
          headers: { 
            'x-access-key': tokenParts.slice(0, 2).join('-'),
            'x-secret-key': tokenParts.slice(2).join('-')
          } as Record<string, string> 
        },
      ]

      const testResults = []

      for (const format of authFormats) {
        try {
          const testUrl = format.url || `${API_URL}/v1/products/${PRODUCT_ID}`
          const testResponse = await fetch(testUrl, {
            headers: {
              ...format.headers,
              'Content-Type': 'application/json',
            },
          })

          const result = {
            format: format.name,
            status: testResponse.status,
            statusText: testResponse.statusText,
            ok: testResponse.ok,
            response: '',
          }

          try {
            const responseData = await testResponse.text()
            result.response = responseData.substring(0, 300)
          } catch (e) {
            result.response = 'Não foi possível ler resposta'
          }

          testResults.push(result)

          // Se encontrou um que funciona, para
          if (testResponse.ok) {
            break
          }
        } catch (error: any) {
          testResults.push({
            format: format.name,
            error: error.message,
            type: error.name,
          })
        }
      }

      apiTest = {
        endpoint: `/v1/products/${PRODUCT_ID}`,
        tokenParts: tokenParts.length,
        testResults,
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Teste de configuração Appmax',
      timestamp: new Date().toISOString(),
      configuration: config,
      apiConnectionTest: apiTest,
      warnings: [
        !API_TOKEN && '⚠️ APPMAX_API_TOKEN não está configurado',
        !WEBHOOK_SECRET && '⚠️ APPMAX_WEBHOOK_SECRET não está configurado (necessário para validar webhooks)',
        !ORDER_BUMP_1 && '⚠️ APPMAX_ORDER_BUMP_1_ID não está configurado',
        !ORDER_BUMP_2 && '⚠️ APPMAX_ORDER_BUMP_2_ID não está configurado',
        !ORDER_BUMP_3 && '⚠️ APPMAX_ORDER_BUMP_3_ID não está configurado',
      ].filter(Boolean),
      nextSteps: [
        '1. Se a API retornou erro 401/403, verifique se o token está correto',
        '2. Acesse o painel Appmax para confirmar os IDs dos produtos',
        '3. Configure o webhook secret no .env.local',
        '4. Consulte a documentação da API em https://admin.appmax.com.br',
      ],
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}
