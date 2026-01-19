/**
 * Autenticação AWS Signature V4 para Appmax
 * A Appmax usa o mesmo sistema de autenticação da AWS
 */

import crypto from 'crypto'

interface SignatureParams {
  method: string
  url: string
  headers: Record<string, string>
  body?: string
  accessKey: string
  secretKey: string
  region?: string
  service?: string
}

/**
 * Gera assinatura AWS Signature V4
 */
export function generateAwsSignature(params: SignatureParams): Record<string, string> {
  const {
    method,
    url,
    headers,
    body = '',
    accessKey,
    secretKey,
    region = 'us-east-1',
    service = 'execute-api',
  } = params

  // Parse URL
  const urlObj = new URL(url)
  const host = urlObj.hostname
  const path = urlObj.pathname + urlObj.search

  // Data e hora
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.substring(0, 8)

  // Canonical headers
  const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\n`
  const signedHeaders = 'host;x-amz-date'

  // Payload hash
  const payloadHash = crypto.createHash('sha256').update(body).digest('hex')

  // Canonical request
  const canonicalRequest = [
    method,
    path,
    '', // query string (já está no path)
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  // String to sign
  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join('\n')

  // Signing key
  const kDate = hmac(`AWS4${secretKey}`, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  const kSigning = hmac(kService, 'aws4_request')

  // Signature
  const signature = hmac(kSigning, stringToSign, 'hex')

  // Authorization header
  const authHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    'Authorization': authHeader,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    ...headers,
  }
}

function hmac(key: string | Buffer, data: string, encoding: 'hex' | undefined = undefined): any {
  const hmac = crypto.createHmac('sha256', key)
  hmac.update(data)
  return encoding ? hmac.digest(encoding) : hmac.digest()
}

/**
 * Cria headers autenticados para requisição Appmax
 */
export function createAppmaxAuthHeaders(
  method: string,
  url: string,
  body?: string,
  additionalHeaders: Record<string, string> = {}
): Record<string, string> {
  const apiToken = process.env.APPMAX_API_TOKEN || ''
  
  // O token da Appmax pode estar no formato: ACCESS_KEY-SECRET_KEY
  // Ou pode ser apenas um token único que precisa ser enviado de forma diferente
  
  // Vamos tentar dividir o token
  const tokenParts = apiToken.split('-')
  
  if (tokenParts.length >= 2) {
    // Se tiver hífen, assume formato AWS-like
    const accessKey = tokenParts.slice(0, 2).join('-')
    const secretKey = tokenParts.slice(2).join('-')
    
    return generateAwsSignature({
      method,
      url,
      headers: additionalHeaders,
      body,
      accessKey,
      secretKey,
      service: 'appmax',
    })
  }
  
  // Se não tiver hífen, pode ser outro formato
  // Vamos retornar headers básicos para teste
  return {
    'x-api-key': apiToken,
    'Authorization': apiToken,
    ...additionalHeaders,
  }
}
