# ✅ Checklist de Implementação - Checkout Appmax

Use este checklist para garantir que tudo está configurado corretamente.

---

## 📋 Fase 1: Configuração Inicial

### 1.1 Conta Appmax
- [ ] Tenho conta ativa na Appmax
- [ ] Sei onde está o painel de configurações
- [ ] Tenho acesso às configurações de API

### 1.2 Produto Principal
- [ ] Produto está ativo na Appmax (ID: 32880073)
- [ ] Link de checkout antigo funciona
- [ ] Sei o preço e detalhes do produto

---

## 🔑 Fase 2: API e Tokens

### 2.1 Obter Token de API
- [ ] Acessei Configurações → API no painel Appmax
- [ ] Gerei um novo token de API
- [ ] Copiei o token (guarde em local seguro!)
- [ ] Adicionei ao `.env.local` como `APPMAX_API_TOKEN`

### 2.2 Confirmar Endpoints
- [ ] Verifiquei documentação oficial da API Appmax
- [ ] Confirmei URL base da API
- [ ] Confirmei estrutura dos endpoints
- [ ] Testei autenticação (se possível)

---

## 🛍️ Fase 3: Produtos de Order Bump

### 3.1 Criar Produto VIP
- [ ] Criei produto "Consultoria VIP" na Appmax
- [ ] Preço: R$ 147
- [ ] Produto está ativo
- [ ] Anotei o ID do produto
- [ ] Adicionei ao `.env.local` como `APPMAX_ORDER_BUMP_VIP_ID`

### 3.2 Criar Produto Biblioteca
- [ ] Criei produto "Biblioteca Premium" na Appmax
- [ ] Preço: R$ 97
- [ ] Produto está ativo
- [ ] Anotei o ID do produto
- [ ] Adicionei ao `.env.local` como `APPMAX_ORDER_BUMP_LIBRARY_ID`

---

## 💻 Fase 4: Código Backend

### 4.1 Arquivos Criados
- [x] `lib/appmax.ts` - Funções de integração
- [x] `app/api/checkout/route.ts` - Endpoint de checkout
- [x] `app/api/checkout/status/route.ts` - Verificar status
- [x] `.env.example` - Template de variáveis

### 4.2 Variáveis de Ambiente
- [ ] Copiei `.env.example` para `.env.local`
- [ ] Preenchi `APPMAX_API_URL`
- [ ] Preenchi `APPMAX_API_TOKEN`
- [ ] Preenchi `APPMAX_PRODUCT_ID`
- [ ] Preenchi `APPMAX_ORDER_BUMP_VIP_ID`
- [ ] Preenchi `APPMAX_ORDER_BUMP_LIBRARY_ID`
- [ ] Preenchi `APPMAX_WEBHOOK_SECRET`

### 4.3 Instalação de Dependências
- [ ] Executei `npm install` (se necessário)
- [ ] Sem erros de TypeScript
- [ ] Build funcionando

---

## 🎨 Fase 5: Frontend

### 5.1 Atualizar Checkout
- [ ] Li `CHECKOUT_FRONTEND_EXAMPLE.md`
- [ ] Adicionei estados do formulário
- [ ] Implementei função `handleCheckout()`
- [ ] Adicionei validações (CPF, email, etc.)
- [ ] Criei formulário de dados pessoais
- [ ] Criei formulário de cartão de crédito
- [ ] Implementei seletor PIX vs Cartão
- [ ] Adicionei loading states

### 5.2 Modal PIX
- [ ] Criei modal para exibir QR Code
- [ ] Implementei polling de status
- [ ] Adicionei animações de carregamento
- [ ] Testei responsividade

### 5.3 Experiência do Usuário
- [ ] Mensagens de erro claras
- [ ] Loading states em botões
- [ ] Validação em tempo real
- [ ] Feedback visual (toasts, alerts)

---

## 🔔 Fase 6: Webhooks

### 6.1 Configuração na Appmax
- [ ] Acessei Configurações → Webhooks
- [ ] Adicionei URL: `https://meusite.com/api/webhook/appmax`
- [ ] Selecionei eventos: `order.approved`, `order.cancelled`
- [ ] Salvei configurações
- [ ] Obtive o Webhook Secret
- [ ] Adicionei ao `.env.local`

### 6.2 Validação de Webhook
- [ ] Implementei validação de assinatura
- [ ] Testei webhook com ferramenta (Postman/Insomnia)
- [ ] Verifico logs de webhooks recebidos

---

## 🧪 Fase 7: Testes

### 7.1 Teste Local (Development)
- [ ] Servidor rodando: `npm run dev`
- [ ] Checkout carregando sem erros
- [ ] Formulários funcionando
- [ ] Console sem erros JavaScript
- [ ] TypeScript sem erros

### 7.2 Teste de Fluxo PIX
- [ ] Consigo preencher o formulário
- [ ] Consigo selecionar Order Bumps
- [ ] Botão "Finalizar Compra" funciona
- [ ] QR Code é exibido corretamente
- [ ] Polling de status funciona
- [ ] Redireciona após "pagamento aprovado"

### 7.3 Teste de Fluxo Cartão
- [ ] Consigo preencher dados do cartão
- [ ] Validação de campos funciona
- [ ] Botão "Finalizar Compra" funciona
- [ ] Tratamento de erro funciona
- [ ] Redireciona após aprovação

### 7.4 Teste com Ambiente Real
- [ ] Testei com cartão de teste (se disponível)
- [ ] Testei PIX real (valor baixo)
- [ ] Webhook foi disparado corretamente
- [ ] Acesso foi liberado no sistema
- [ ] Email de confirmação enviado

---

## 🚀 Fase 8: Deploy em Produção

### 8.1 Ambiente de Produção
- [ ] Variáveis de ambiente configuradas no servidor
- [ ] HTTPS configurado (obrigatório!)
- [ ] Domínio configurado
- [ ] Build de produção funcionando

### 8.2 Webhook em Produção
- [ ] URL de webhook atualizada na Appmax
- [ ] URL usa HTTPS
- [ ] Webhook testado em produção
- [ ] Logs de webhook funcionando

### 8.3 Monitoramento
- [ ] Logs de erros configurados
- [ ] Alertas de falha (opcional)
- [ ] Analytics implementado (opcional)

---

## 🎯 Fase 9: Validação Final

### 9.1 Compra Teste Completa
- [ ] Fiz uma compra teste real
- [ ] Pagamento foi aprovado
- [ ] Webhook foi recebido
- [ ] Acesso foi liberado
- [ ] Email foi enviado
- [ ] Pedido aparece na Appmax

### 9.2 Experiência do Cliente
- [ ] Checkout carrega rápido
- [ ] Design está bonito
- [ ] Funciona no mobile
- [ ] Funciona em diferentes navegadores
- [ ] Mensagens de erro são claras

### 9.3 Relatórios
- [ ] Consigo ver vendas na Appmax
- [ ] Consigo ver Order Bumps vendidos
- [ ] Relatórios estão corretos

---

## 📊 Status Geral

**Backend**: [ ] Completo  
**Frontend**: [ ] Completo  
**Webhooks**: [ ] Completo  
**Testes**: [ ] Completo  
**Produção**: [ ] Completo  

---

## 🆘 Troubleshooting

### Erro: "Token inválido"
- Verifique se copiou o token completo
- Token pode ter expirado - gere um novo
- Verifique formato: `Bearer SEU_TOKEN`

### Erro: "Produto não encontrado"
- Verifique o ID do produto
- Produto pode estar inativo
- Verifique permissões da API

### Webhook não dispara
- Confirme URL no painel Appmax
- URL deve ser HTTPS em produção
- Verifique logs do servidor
- Teste com ferramenta de webhook

### QR Code PIX não aparece
- Verifique resposta da API
- Confirme formato base64
- Verifique logs do console

---

## 📞 Recursos de Ajuda

- **Guia Completo**: `APPMAX_INTEGRATION_GUIDE.md`
- **Referência API**: `APPMAX_API_REFERENCE.md`
- **Exemplo Frontend**: `CHECKOUT_FRONTEND_EXAMPLE.md`
- **Solução Resumida**: `CHECKOUT_APPMAX_SOLUTION.md`

---

## ✨ Próximo Nível

Depois que tudo estiver funcionando:

- [ ] Implementar recuperação de carrinho abandonado
- [ ] Adicionar mais Order Bumps
- [ ] Criar upsells pós-compra
- [ ] Implementar programa de afiliados
- [ ] Analytics avançado

---

**Boa sorte com a implementação! 🚀**
