import { NextRequest, NextResponse } from 'next/server'

/**
 * Teste com API v1 da Appmax
 */

const APPMAX_API_TOKEN = process.env.APPMAX_API_TOKEN || ''

export async function GET(request: NextRequest) {
  try {
    const tests = []

    // Teste 1: API v3
    try {
      const urlV3 = 'https://admin.appmax.com.br/api/v3/order?limit=5&offset=0'
      const responseV3 = await fetch(urlV3, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${APPMAX_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
      const dataV3 = await responseV3.json()
      tests.push({
        version: 'v3',
        url: urlV3,
        status: responseV3.status,
        success: responseV3.ok,
        response: dataV3
      })
    } catch (e: any) {
      tests.push({
        version: 'v3',
        error: e.message
      })
    }

    // Teste 2: API v1
    try {
      const urlV1 = 'https://admin.appmax.com.br/api/v1/order?limit=5&offset=0'
      const responseV1 = await fetch(urlV1, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${APPMAX_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
      const dataV1 = await responseV1.json()
      tests.push({
        version: 'v1',
        url: urlV1,
        status: responseV1.status,
        success: responseV1.ok,
        response: dataV1
      })
    } catch (e: any) {
      tests.push({
        version: 'v1',
        error: e.message
      })
    }

    // Teste 3: Sem versão (base)
    try {
      const urlBase = 'https://admin.appmax.com.br/api/order?limit=5&offset=0'
      const responseBase = await fetch(urlBase, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${APPMAX_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      })
      const dataBase = await responseBase.json()
      tests.push({
        version: 'base (sem versão)',
        url: urlBase,
        status: responseBase.status,
        success: responseBase.ok,
        response: dataBase
      })
    } catch (e: any) {
      tests.push({
        version: 'base',
        error: e.message
      })
    }

    return NextResponse.json({
      token: APPMAX_API_TOKEN ? `***${APPMAX_API_TOKEN.slice(-4)}` : 'NÃO CONFIGURADO',
      tests
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
