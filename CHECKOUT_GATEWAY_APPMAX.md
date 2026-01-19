# 🎯 Checkout Customizado com Gateway Appmax

## 💡 Solução Simples

A Appmax **já tem gateway de pagamento próprio**. Você só precisa:

1. ✅ Criar seu checkout bonito
2. ✅ Coletar os dados do cliente
3. ✅ Enviar para API da Appmax
4. ✅ **Appmax processa tudo** (gateway incluso!)

---

## 🔥 Ponto Chave

**Você NÃO precisa:**
- ❌ Configurar Mercado Pago
- ❌ Configurar Stripe
- ❌ Configurar outro gateway
- ❌ Implementar processamento de cartão
- ❌ Configurar PIX manualmente

**A Appmax já tem TUDO:**
- ✅ Gateway de Cartão de Crédito
- ✅ Gateway de PIX (QR Code automático)
- ✅ Gateway de Boleto
- ✅ Sistema antifraude
- ✅ PCI Compliance
- ✅ Webhooks automáticos

---

## 🚀 Fluxo Simplificado

```
┌──────────────────────────────────────┐
│  1. SEU CHECKOUT BONITO              │
│  ┌────────────────────────────────┐  │
│  │ Nome: [____________]           │  │
│  │ Email: [___________]           │  │
│  │ CPF: [_____________]           │  │
│  │                                │  │
│  │ Forma de pagamento:            │  │
│  │  ○ PIX    ● Cartão            │  │
│  │                                │  │
│  │ Número: [________________]     │  │
│  │ Nome: [__________________]     │  │
│  │ Validade: [__] / [____]       │  │
│  │ CVV: [___]                     │  │
│  │                                │  │
│  │  [  FINALIZAR COMPRA 🔒  ]     │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
                 ↓
         Clica no botão
                 ↓
┌──────────────────────────────────────┐
│  2. VOCÊ ENVIA PARA APPMAX           │
│                                      │
│  POST /api/checkout                  │
│    ↓                                 │
│  createAppmaxOrder({                 │
│    customer: { name, email, cpf },   │
│    payment_method: 'credit_card',    │
│    card_data: { number, cvv, ... }   │
│  })                                  │
│    ↓                                 │
│  Appmax API (com gateway)            │
└──────────────────────────────────────┘
                 ↓
    Gateway processa tudo
                 ↓
┌──────────────────────────────────────┐
│  3. APPMAX RETORNA RESULTADO         │
│                                      │
│  Se PIX:                             │
│    { pixQrCode, pixQrCodeBase64 }    │
│                                      │
│  Se Cartão:                          │
│    { status: 'approved' }            │
│    ou                                │
│    { payment_url } (3DS)             │
└──────────────────────────────────────┘
                 ↓
  Você mostra no SEU design
                 ↓
┌──────────────────────────────────────┐
│  4. SEU CHECKOUT (RESULTADO)         │
│                                      │
│  Se PIX:                             │
│  ┌────────────────────────────────┐  │
│  │  💰 Pague com PIX              │  │
│  │  ┌──────────────────────────┐  │  │
│  │  │  [QR CODE AQUI]          │  │  │
│  │  └──────────────────────────┘  │  │
│  │  Aguardando pagamento... ⏳   │  │
│  └────────────────────────────────┘  │
│                                      │
│  Se Cartão Aprovado:                 │
│  ┌────────────────────────────────┐  │
│  │  ✅ Pagamento Aprovado!        │  │
│  │  Redirecionando...             │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## 💻 Código Necessário

### Backend (`app/api/checkout/route.ts`)

```typescript
import { createAppmaxOrder } from "@/lib/appmax"

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // Envia DIRETO para Appmax (com gateway deles)
  const result = await createAppmaxOrder({
    customer: {
      name: body.name,
      email: body.email,
      cpf: body.cpf,
      phone: body.phone,
    },
    product_id: process.env.APPMAX_PRODUCT_ID,
    quantity: 1,
    payment_method: body.paymentMethod, // 'pix' ou 'credit_card'
    
    // Se cartão, Appmax processa com gateway próprio
    card_data: body.paymentMethod === 'credit_card' ? {
      number: body.cardData.number,
      holder_name: body.cardData.holderName,
      exp_month: body.cardData.expMonth,
      exp_year: body.cardData.expYear,
      cvv: body.cardData.cvv,
      installments: body.cardData.installments || 1,
    } : undefined,
  })

  return NextResponse.json(result)
}
```

### Frontend (`app/checkout/page.tsx`)

```typescript
const handleCheckout = async () => {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      cpf: formData.cpf,
      phone: formData.phone,
      paymentMethod: paymentMethod, // 'pix' ou 'credit_card'
      cardData: paymentMethod === 'credit_card' ? {
        number: cardNumber,
        holderName: holderName,
        expMonth: expMonth,
        expYear: expYear,
        cvv: cvv,
        installments: 1
      } : undefined
    })
  })

  const result = await response.json()
  
  if (result.success) {
    if (paymentMethod === 'pix') {
      // Mostra QR Code no SEU modal bonito
      setPixQrCode(result.pixQrCodeBase64)
      // Inicia polling
      startPolling(result.orderId)
    } else {
      // Cartão: redireciona
      window.location.href = '/checkout/success'
    }
  }
}
```

---

## 🎨 O Que Você Controla

### ✅ Seu Design Completo:
- Layout do checkout
- Cores e fontes
- Animações
- Modal do PIX
- Página de sucesso
- Mensagens de erro
- Loading states

### ✅ Appmax Cuida:
- Processar cartão
- Gerar QR Code PIX
- Gerar boleto
- Antifraude
- Segurança PCI
- Confirmar pagamento
- Enviar webhooks

---

## 📦 Configuração Necessária

### 1. Variáveis de Ambiente (`.env.local`)

```bash
# Token da API Appmax
APPMAX_API_TOKEN=seu_token_aqui

# ID do produto
APPMAX_PRODUCT_ID=32880073

# Webhook secret
APPMAX_WEBHOOK_SECRET=seu_secret_aqui
```

### 2. Obter Token

1. Painel Appmax → **Configurações** → **API**
2. Gerar novo token
3. Copiar e colar no `.env.local`

### 3. Configurar Webhook

1. Painel Appmax → **Configurações** → **Webhooks**
2. URL: `https://seusite.com/api/webhook/appmax`
3. Eventos: `order.approved`, `order.cancelled`

---

## 🎯 Resultado Final

```
ANTES (Checkout Appmax):
  ❌ Design feio
  ❌ Sem controle
  ❌ Não pode customizar

DEPOIS (Seu Checkout):
  ✅ Design lindo (SEU)
  ✅ Controle total
  ✅ Gateway da Appmax (sem configurar)
  ✅ Order bumps customizados
  ✅ Experiência perfeita
```

---

## ⚡ Próximo Passo

1. **Configure** as variáveis de ambiente
2. **Implemente** o frontend usando os exemplos
3. **Teste** com dados reais
4. **Configure** o webhook
5. **Deploy** e seja feliz! 🎉

---

## 📞 Resumo Ultra Simples

**Você:**  
Faz o checkout bonito e coleta os dados

**Appmax:**  
Processa o pagamento com gateway próprio

**Resultado:**  
Checkout lindo + Pagamento funcionando

**Sem precisar configurar gateway nenhum!** 🚀
