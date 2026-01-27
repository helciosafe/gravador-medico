# 🚨 AÇÃO NECESSÁRIA: Atualizar Edge Function no Lovable

## ⚠️ Problema Identificado

O erro **400 (Bad Request)** ao desativar usuário ocorre porque:

- ✅ Frontend está correto (envia PATCH com `userId` e `action`)
- ✅ API Route está correta (valida e chama service)
- ✅ Service Layer está correto (chama Edge Function)
- ❌ **Edge Function no servidor Lovable NÃO tem os endpoints PATCH e DELETE**

## 📝 O que aconteceu

Quando implementamos as funções de desativar e excluir, atualizamos apenas o arquivo de **documentação** (`docs/lovable-edge-function.ts`), mas a Edge Function **real** que está rodando no servidor Lovable ainda não foi atualizada.

---

## 🔧 Solução: Atualizar Edge Function no Lovable

### Passo 1: Acessar o Projeto Lovable

1. Acesse: https://lovable.dev
2. Faça login
3. Abra o projeto onde está a Edge Function `admin-user-manager`

### Passo 2: Localizar a Edge Function

Procure pelo arquivo da Edge Function:
- Caminho: `supabase/functions/admin-user-manager/index.ts`
- Ou similar dependendo da estrutura do projeto

### Passo 3: Adicionar os Novos Endpoints

Você precisa adicionar dois novos blocos de código **ANTES** da linha que diz `"Method Not Allowed"`:

#### A) Endpoint PATCH (Desativar/Reativar)

Adicione este código após o bloco PUT (reset password):

```typescript
// =====================================================
// PATCH: DESATIVAR/ATIVAR USUÁRIO
// =====================================================
if (method === 'PATCH') {
  const body: { userId: string; action: 'ban' | 'unban' } = await req.json()
  const { userId, action } = body

  if (!userId || !action) {
    return new Response(
      JSON.stringify({ 
        error: 'Validation Error',
        message: 'userId e action são obrigatórios' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  console.log(`🔒 ${action === 'ban' ? 'Desativando' : 'Ativando'} usuário:`, userId)

  const updateData = action === 'ban' 
    ? { ban_duration: '876000h' } // ~100 anos (ban permanente)
    : { ban_duration: 'none' }

  const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    updateData
  )

  if (updateError) {
    console.error(`❌ Erro ao ${action === 'ban' ? 'desativar' : 'ativar'}:`, updateError)
    return new Response(
      JSON.stringify({ 
        error: 'Update Error',
        message: updateError.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      message: `Usuário ${action === 'ban' ? 'desativado' : 'ativado'} com sucesso`,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}
```

#### B) Endpoint DELETE (Excluir)

Adicione este código após o bloco PATCH:

```typescript
// =====================================================
// DELETE: EXCLUIR USUÁRIO
// =====================================================
if (method === 'DELETE') {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')

  if (!userId) {
    return new Response(
      JSON.stringify({ 
        error: 'Validation Error',
        message: 'userId é obrigatório' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  console.log('🗑️ Excluindo usuário:', userId)

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (deleteError) {
    console.error('❌ Erro ao excluir usuário:', deleteError)
    return new Response(
      JSON.stringify({ 
        error: 'Delete Error',
        message: deleteError.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Usuário excluído com sucesso'
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}
```

### Passo 4: Estrutura Final do Código

Após as modificações, a Edge Function deve ter esta ordem:

```typescript
// ... imports e configuração ...

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') { /* ... */ }

  // Validação de segurança
  const apiSecret = req.headers.get('x-api-secret')
  if (apiSecret !== EXPECTED_SECRET) { /* ... */ }

  const method = req.method

  // GET: Listar usuários
  if (method === 'GET') { /* ... */ }

  // POST: Criar usuário
  if (method === 'POST') { /* ... */ }

  // PUT: Resetar senha
  if (method === 'PUT') { /* ... */ }

  // PATCH: Desativar/Reativar (NOVO!)
  if (method === 'PATCH') { /* ... */ }

  // DELETE: Excluir (NOVO!)
  if (method === 'DELETE') { /* ... */ }

  // Method Not Allowed (deixar por último)
  return new Response(
    JSON.stringify({ error: 'Method Not Allowed' }),
    { status: 405, headers: corsHeaders }
  )
})
```

### Passo 5: Fazer Deploy

Depois de adicionar o código:

1. **Salve o arquivo**
2. **Faça commit** das mudanças
3. **Deploy da Edge Function**:
   - No Lovable, vá em Settings → Edge Functions
   - Ou use o CLI do Supabase: `supabase functions deploy admin-user-manager`

### Passo 6: Testar

Após o deploy, teste no Dashboard:

```bash
# Teste PATCH (desativar)
curl -X PATCH 'https://acouwzdniytqhaesgtpr.supabase.co/functions/v1/admin-user-manager' \
  -H 'x-api-secret: webhook-appmax-2026-secure-key' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "SEU_USER_ID_AQUI", "action": "ban"}'

# Teste DELETE (excluir)
curl -X DELETE 'https://acouwzdniytqhaesgtpr.supabase.co/functions/v1/admin-user-manager?userId=SEU_USER_ID_AQUI' \
  -H 'x-api-secret: webhook-appmax-2026-secure-key'
```

---

## 📄 Código Completo Pronto

Se preferir, o código completo da Edge Function está no arquivo:
```
docs/lovable-edge-function.ts
```

Você pode copiar todo o conteúdo desse arquivo e substituir o código atual no Lovable.

---

## ✅ Como Verificar se Funcionou

Depois de atualizar e fazer deploy:

1. Acesse: `http://localhost:3000/admin/lovable/users`
2. Clique no botão **🚫 amarelo** de qualquer usuário
3. Confirme a desativação
4. Se funcionar: ✅ Verá toast verde "🔒 Usuário desativado"
5. Se ainda der erro: ❌ Verifique os logs da Edge Function no Lovable

---

## 🆘 Alternativa Temporária

Se não conseguir atualizar a Edge Function agora, você pode:

1. **Desabilitar os botões** temporariamente:
   - Comente os botões de desativar e excluir no código
   - Mantenha apenas o botão de alterar senha

2. **Usar direto no Supabase**:
   - Acesse o Supabase Dashboard do Lovable
   - Vá em Authentication → Users
   - Gerencie usuários manualmente por lá

---

## 📞 Precisa de Ajuda?

Se tiver dificuldade para atualizar no Lovable:

1. Me mostre a estrutura de pastas do projeto Lovable
2. Me mostre o código atual da Edge Function
3. Posso ajudar a adaptar o código para o seu setup específico

---

## 🎯 Resumo Rápido

**Problema**: Edge Function no Lovable não tem PATCH e DELETE  
**Solução**: Adicionar os dois blocos de código acima  
**Local**: `supabase/functions/admin-user-manager/index.ts`  
**Ação**: Deploy da Edge Function  
**Teste**: Tentar desativar usuário novamente  

✅ Após isso, tudo funcionará perfeitamente!
