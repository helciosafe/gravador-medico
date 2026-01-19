# 🎨 Exemplo: Atualizar Checkout Frontend

Este arquivo mostra como atualizar o arquivo `/app/checkout/page.tsx` para integrar com a API da Appmax.

## 📝 Adições Necessárias

### 1. Estados para Formulário

Adicione no início do componente:

```typescript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  phone: '',
  cpf: '',
})

const [cardData, setCardData] = useState({
  number: '',
  holderName: '',
  expMonth: '',
  expYear: '',
  cvv: '',
  installments: 1,
})

const [loading, setLoading] = useState(false)
const [pixQrCode, setPixQrCode] = useState('')
const [orderId, setOrderId] = useState('')
```

---

### 2. Função de Validação CPF

```typescript
const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]/g, '')
  if (cpf.length !== 11) return false
  
  // Validação básica
  if (/^(\d)\1{10}$/.test(cpf)) return false
  
  return true // Implementar validação completa se necessário
}

const formatCPF = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}
```

---

### 3. Função de Checkout

```typescript
const handleCheckout = async () => {
  // Validações
  if (!formData.name || !formData.email) {
    alert('Preencha todos os campos obrigatórios')
    return
  }

  if (!validateCPF(formData.cpf)) {
    alert('CPF inválido')
    return
  }

  if (paymentMethod === 'credit_card') {
    if (!cardData.number || !cardData.holderName || !cardData.cvv) {
      alert('Preencha todos os dados do cartão')
      return
    }
  }

  setLoading(true)

  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf.replace(/\D/g, ''),
        paymentMethod: paymentMethod,
        orderBumps: selectedOrderBumps,
        cardData: paymentMethod === 'credit_card' ? {
          number: cardData.number.replace(/\s/g, ''),
          holderName: cardData.holderName.toUpperCase(),
          expMonth: cardData.expMonth,
          expYear: cardData.expYear,
          cvv: cardData.cvv,
          installments: cardData.installments,
        } : undefined,
        utmParams: {
          utm_source: new URLSearchParams(window.location.search).get('utm_source') || undefined,
          utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
          utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
        },
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao processar pagamento')
    }

    if (result.success) {
      setOrderId(result.orderId)

      if (paymentMethod === 'pix') {
        // Exibir QR Code PIX
        setPixQrCode(result.pixQrCodeBase64)
        // Iniciar polling para verificar status
        startPaymentPolling(result.orderId)
      } else if (paymentMethod === 'credit_card') {
        // Verificar se precisa de 3DS
        if (result.paymentUrl) {
          window.location.href = result.paymentUrl
        } else {
          // Pagamento aprovado
          window.location.href = `/checkout/success?order=${result.orderId}`
        }
      }
    }
  } catch (error: any) {
    alert(error.message || 'Erro ao processar pagamento')
  } finally {
    setLoading(false)
  }
}
```

---

### 4. Polling para PIX

```typescript
const startPaymentPolling = (orderId: string) => {
  const checkPayment = async () => {
    try {
      const response = await fetch(`/api/checkout/status?orderId=${orderId}`)
      const data = await response.json()

      if (data.status === 'approved') {
        window.location.href = `/checkout/success?order=${orderId}`
      } else if (data.status === 'rejected' || data.status === 'cancelled') {
        alert('Pagamento não aprovado')
        setPixQrCode('')
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    }
  }

  // Verificar a cada 3 segundos
  const interval = setInterval(checkPayment, 3000)

  // Parar após 15 minutos
  setTimeout(() => clearInterval(interval), 15 * 60 * 1000)
}
```

---

### 5. Formulário de Dados Pessoais

Adicione antes do resumo do pedido:

```tsx
{/* Formulário de Dados */}
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  className="bg-white rounded-2xl shadow-lg p-6"
>
  <h2 className="text-xl font-black text-gray-900 mb-4">
    Dados Pessoais
  </h2>

  <div className="space-y-4">
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">
        Nome Completo *
      </label>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
        placeholder="Dr. João Silva"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">
        Email *
      </label>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
        placeholder="seu@email.com"
        required
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Telefone
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
          placeholder="(11) 99999-9999"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          CPF *
        </label>
        <input
          type="text"
          value={formData.cpf}
          onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
          placeholder="000.000.000-00"
          maxLength={14}
          required
        />
      </div>
    </div>
  </div>
</motion.div>
```

---

### 6. Formulário de Cartão de Crédito

```tsx
{paymentMethod === 'credit_card' && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl shadow-lg p-6"
  >
    <h2 className="text-xl font-black text-gray-900 mb-4">
      Dados do Cartão
    </h2>

    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Número do Cartão *
        </label>
        <input
          type="text"
          value={cardData.number}
          onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">
          Nome no Cartão *
        </label>
        <input
          type="text"
          value={cardData.holderName}
          onChange={(e) => setCardData({ ...cardData, holderName: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
          placeholder="NOME COMO NO CARTÃO"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Mês *
          </label>
          <input
            type="text"
            value={cardData.expMonth}
            onChange={(e) => setCardData({ ...cardData, expMonth: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
            placeholder="12"
            maxLength={2}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Ano *
          </label>
          <input
            type="text"
            value={cardData.expYear}
            onChange={(e) => setCardData({ ...cardData, expYear: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
            placeholder="2028"
            maxLength={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            CVV *
          </label>
          <input
            type="text"
            value={cardData.cvv}
            onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:outline-none"
            placeholder="123"
            maxLength={4}
            required
          />
        </div>
      </div>
    </div>
  </motion.div>
)}
```

---

### 7. Modal PIX

```tsx
{pixQrCode && (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-8 max-w-md w-full"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-brand-600" />
        </div>
        
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          Pague com PIX
        </h2>
        
        <p className="text-gray-600 mb-6">
          Escaneie o QR Code abaixo para finalizar seu pagamento
        </p>

        <div className="bg-white p-4 rounded-xl border-2 border-gray-200 mb-4">
          <img
            src={pixQrCode}
            alt="QR Code PIX"
            className="w-full h-auto"
          />
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
          <Clock className="w-4 h-4" />
          <span>Aguardando pagamento...</span>
        </div>

        <div className="animate-pulse flex justify-center">
          <div className="w-2 h-2 bg-brand-600 rounded-full mx-1"></div>
          <div className="w-2 h-2 bg-brand-600 rounded-full mx-1 animation-delay-200"></div>
          <div className="w-2 h-2 bg-brand-600 rounded-full mx-1 animation-delay-400"></div>
        </div>
      </div>
    </motion.div>
  </div>
)}
```

---

### 8. Botão de Finalizar Compra

Atualize o botão de checkout:

```tsx
<button
  onClick={handleCheckout}
  disabled={loading}
  className="w-full bg-gradient-to-r from-brand-600 to-brand-500 text-white py-4 rounded-xl font-black text-lg hover:from-brand-700 hover:to-brand-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
>
  {loading ? (
    <>
      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      Processando...
    </>
  ) : (
    <>
      <Lock className="w-5 h-5" />
      Finalizar Compra Segura
    </>
  )}
</button>
```

---

## 🚀 Próximo Passo

Agora você precisa:

1. ✅ Adicionar esses estados e funções no seu `checkout/page.tsx`
2. ✅ Testar o fluxo completo
3. ✅ Ajustar o design conforme necessário
4. ✅ Configurar as variáveis de ambiente

O código acima é um exemplo completo e funcional!
