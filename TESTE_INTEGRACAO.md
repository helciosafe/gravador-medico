# 🧪 Como Testar a Integração Appmax

## 🚀 Teste Rápido de Configuração

### 1. Inicie o servidor
```bash
npm run dev
```

### 2. Acesse a rota de teste
Abra no navegador:
```
http://localhost:3000/api/test/appmax
```

**O que você verá:**
- ✅ Configurações do ambiente (.env.local)
- ✅ Status do token API (mascarado)
- ✅ IDs dos produtos configurados
- ✅ Status do webhook
- ✅ Teste de conexão com a API Appmax
- ⚠️ Avisos sobre configurações faltantes

---

## 🛒 Teste do Checkout Completo

### Passo 1: Acesse o checkout
```
http://localhost:3000/checkout
```

### Passo 2: Preencha a Etapa 1 (Dados Pessoais)
- **Nome:** João Silva
- **Email:** joao@teste.com
- **Telefone:** (11) 98765-4321
- **CPF:** 123.456.789-00

Clique em **"Continuar para Order Bumps"**

### Passo 3: Selecione Order Bumps (Etapa 2)
Teste selecionando:
- [ ] Order Bump 1 - Consultoria VIP (R$ 147)
- [ ] Order Bump 2 - Biblioteca Premium (R$ 97)
- [ ] Order Bump 3 - Treinamento Avançado (R$ 127)

Observe o cálculo automático no resumo lateral.

Clique em **"Ir para Pagamento"**

### Passo 4: Teste o Pagamento (Etapa 3)

#### Opção A: Teste com PIX
1. Selecione **"PIX"**
2. Observe o desconto de 5% aplicado
3. Clique em **"Finalizar Compra com PIX"**
4. ⏱️ Aguarde o processamento
5. Modal do QR Code deve aparecer
6. Verifique no console do navegador se houve erros

#### Opção B: Teste com Cartão
1. Selecione **"Cartão de Crédito"**
2. Preencha os dados:
   - **Número:** 4111 1111 1111 1111 (teste Visa)
   - **Nome:** JOAO SILVA
   - **Validade:** 12/2028
   - **CVV:** 123
   - **Parcelas:** 1x sem juros
3. Clique em **"Finalizar Compra"**
4. ⏱️ Aguarde o processamento

---

## 🔍 O Que Observar

### ✅ Sucesso
- Formulário valida em tempo real
- Formatação automática (CPF, telefone, cartão)
- Timer contando regressivamente
- Cálculo correto dos valores
- Transição suave entre etapas
- Carrossel de depoimentos funcionando
- Redirecionamento ou modal PIX

### ❌ Possíveis Erros

#### Erro 401/403 (Autenticação)
```json
{
  "error": "Unauthorized"
}
```
**Solução:** Verifique se o token API está correto no `.env.local`

#### Erro 404 (Produto não encontrado)
```json
{
  "error": "Product not found"
}
```
**Solução:** Confirme os IDs dos produtos no painel Appmax

#### Erro de validação
```json
{
  "error": "Dados incompletos"
}
```
**Solução:** Preencha todos os campos obrigatórios

#### Erro de rede
```
Failed to fetch
```
**Solução:** 
- Verifique se o servidor está rodando
- Verifique conexão com a internet
- Veja o console do navegador para mais detalhes

---

## 📊 Monitoramento

### Console do Navegador (F12)
Abra o DevTools e vá para a aba **Console**. Você verá:
- Logs de validação
- Requisições para a API
- Erros (se houver)

### Terminal do Servidor
No terminal onde você rodou `npm run dev`, observe:
- Logs das requisições
- Erros de servidor
- Resposta da API Appmax

---

## 🧪 Testes Específicos

### Teste 1: Validação de Formulário
- [ ] Tente avançar sem preencher campos
- [ ] Digite CPF com menos de 11 dígitos
- [ ] Digite email inválido
- [ ] Verifique se as mensagens de erro aparecem

### Teste 2: Order Bumps
- [ ] Selecione e desselecione order bumps
- [ ] Verifique se o total é atualizado
- [ ] Confirme que os valores batem

### Teste 3: Timer de Urgência
- [ ] Verifique se o timer está contando
- [ ] Observe a barra de progresso diminuindo
- [ ] Veja se a cor muda conforme o tempo

### Teste 4: Responsividade
- [ ] Redimensione a janela do navegador
- [ ] Teste em mobile (F12 → Toggle Device Toolbar)
- [ ] Verifique se o layout se adapta

### Teste 5: Carrossel de Depoimentos
- [ ] Observe se os depoimentos mudam automaticamente
- [ ] Role para ver todos os 6 depoimentos

---

## 🐛 Debug Avançado

### Ver dados enviados para a API
No console do navegador, antes de enviar:
```javascript
// Cole isso no console antes de clicar em finalizar
console.log('Dados que serão enviados:', {
  name: formData.name,
  email: formData.email,
  phone: formData.phone,
  cpf: formData.cpf,
  paymentMethod: paymentMethod,
  orderBumps: selectedOrderBumps,
})
```

### Inspecionar requisição
1. F12 → Aba **Network**
2. Clique em "Finalizar Compra"
3. Encontre a requisição para `/api/checkout`
4. Clique nela para ver:
   - **Headers:** Token, Content-Type
   - **Payload:** Dados enviados
   - **Response:** Resposta da API

---

## 🎯 Resultado Esperado

### Se tudo estiver correto:

**Com PIX:**
```json
{
  "success": true,
  "orderId": "ABC123",
  "status": "pending",
  "pixQrCode": "00020126...",
  "pixQrCodeBase64": "data:image/png;base64,..."
}
```

**Com Cartão:**
```json
{
  "success": true,
  "orderId": "ABC123",
  "status": "approved",
  "paymentUrl": null
}
```

Você será redirecionado para:
- **PIX:** Modal com QR Code
- **Cartão:** `/checkout/success?order=ABC123`

---

## 📞 Próximos Passos Após Testes

1. **Se o teste local funcionou:**
   - ✅ Configure o webhook secret
   - ✅ Faça deploy em produção
   - ✅ Teste com transação real (valor mínimo)

2. **Se encontrou erros:**
   - 📧 Anote o erro completo
   - 🔍 Verifique os logs do servidor
   - 📚 Consulte a documentação da Appmax
   - 💬 Entre em contato com o suporte Appmax

3. **Para produção:**
   - 🔐 Use valores reais no `.env` de produção
   - 🌐 Configure DNS apontando para seu servidor
   - 📊 Configure monitoramento (Sentry, LogRocket, etc)
   - 🧪 Faça uma compra teste com valor real

---

## ✅ Checklist de Testes

- [ ] Teste de configuração (`/api/test/appmax`)
- [ ] Teste de validação de formulário
- [ ] Teste de seleção de order bumps
- [ ] Teste de cálculo de valores
- [ ] Teste de pagamento com PIX
- [ ] Teste de pagamento com cartão
- [ ] Teste de responsividade mobile
- [ ] Teste de timer e urgência
- [ ] Teste de carrossel de depoimentos
- [ ] Teste de erros (campos vazios, dados inválidos)

**Quando todos os testes passarem:** 🎉 Sua integração está pronta!
