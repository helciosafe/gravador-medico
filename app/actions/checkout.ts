'use server';
import { cookies, headers } from 'next/headers';
import { sendPurchaseEvent } from '@/lib/meta-capi';
import { v4 as uuidv4 } from 'uuid'; 

/**
 * Exemplo de Server Action para testar o envio de conversão deduplicado
 * O eventId é o mesmo usado no Pixel client-side para evitar duplicação
 */
export async function testarConversao(email: string) {
  const eventId = uuidv4();
  const cookieStore = await cookies();
  const headersList = await headers();

  const result = await sendPurchaseEvent({
    orderId: eventId,
    customerEmail: email,
    totalAmount: 197.00,
    currency: 'BRL',
    productName: 'Gravador Médico - Plano Anual',
    fbc: cookieStore.get('_fbc')?.value,
    fbp: cookieStore.get('_fbp')?.value,
    ipAddress: headersList.get('x-forwarded-for') || '0.0.0.0',
    userAgent: headersList.get('user-agent') || '',
    eventSourceUrl: 'https://gravadormedico.com.br/checkout'
  });

  return { success: result.success, eventId };
}

/**
 * Action para registrar Lead (captura de email)
 */
export async function registrarLead(params: {
  email: string;
  phone?: string;
  name?: string;
}) {
  const eventId = uuidv4();
  const cookieStore = await cookies();
  const headersList = await headers();

  // Importar a função genérica para eventos não-Purchase
  const { sendMetaConversionEvent } = await import('@/lib/meta-capi');

  const [firstName, ...lastNameParts] = (params.name || '').split(' ');
  const lastName = lastNameParts.join(' ');

  const result = await sendMetaConversionEvent({
    eventName: 'Lead',
    eventTime: Math.floor(Date.now() / 1000),
    eventId,
    email: params.email,
    phone: params.phone,
    firstName,
    lastName,
    fbc: cookieStore.get('_fbc')?.value,
    fbp: cookieStore.get('_fbp')?.value,
    clientIpAddress: headersList.get('x-forwarded-for') || '0.0.0.0',
    clientUserAgent: headersList.get('user-agent') || '',
    eventSourceUrl: headersList.get('referer') || 'https://gravadormedico.com.br'
  });

  return { success: result.success, eventId };
}
