import { NextRequest, NextResponse } from "next/server"

/**
 * Teste rápido: Criar um cliente de teste na Appmax
 * Acesse: http://localhost:3000/api/test/appmax-customer
 */
export async function GET(request: NextRequest) {
  const API_URL = process.env.APPMAX_API_URL || 'https://api.appmax.com.br'
  const API_TOKEN = process.env.APPMAX_API_TOKEN

  if (!API_TOKEN) {
    return NextResponse.json({ error: 'Token não configurado' }, { status: 400 })
  }

  try {
    // Testa criar um cliente
    const response = await fetch(`${API_URL}/api/v3/customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'access-token': API_TOKEN,
        firstname: 'Teste',
        lastname: 'API',
        email: 'teste@gravadormedico.com.br',
        telephone: '11999999999',
        ip: '127.0.0.1',
      }),
    })

    // Tenta ler como texto primeiro
    const responseText = await response.text()
    
    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      // Não é JSON, retorna o HTML/texto
      result = {
        isHTML: true,
        preview: responseText.substring(0, 1000),
      }
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      endpoint: `${API_URL}/api/v3/customer`,
      headers: Object.fromEntries(response.headers.entries()),
      request: {
        'access-token': `${API_TOKEN.substring(0, 8)}...`,
        firstname: 'Teste',
        lastname: 'API',
        email: 'teste@gravadormedico.com.br',
      },
      response: result,
      message: response.ok 
        ? '✅ Sucesso! A API está funcionando corretamente!' 
        : '❌ Erro ao criar cliente. Verifique o endpoint ou a documentação.',
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}
