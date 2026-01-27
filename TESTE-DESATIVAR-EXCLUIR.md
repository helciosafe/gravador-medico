# 🧪 Guia de Teste: Desativar e Excluir Usuários

## 🚀 Como Testar Agora

### 1. Acesse a Página de Usuários
```
http://localhost:3000/admin/lovable/users
```

### 2. Identifique os Novos Botões

Na coluna **Ações** de cada usuário, você verá 3 ícones:

| Ícone | Cor | Função |
|-------|-----|--------|
| 🔑 | Azul | Alterar Senha |
| 🚫 | Amarelo | Desativar Usuário |
| 🗑️ | Vermelho | Excluir Usuário |

---

## ✅ Teste 1: Desativar Usuário

### Passo a Passo:
1. Clique no ícone **🚫 amarelo** de qualquer usuário
2. Aparecerá um modal com:
   - Título: "Desativar Usuário"
   - Email do usuário
   - Aviso: "O usuário não conseguirá mais fazer login"
3. Clique em **"Sim, Desativar"**
4. Aguarde a mensagem: "🔒 Usuário [email] foi desativado"
5. A lista de usuários será atualizada automaticamente

### O que acontece:
- ✅ Usuário fica bloqueado no Lovable
- ✅ Log registrado no banco com `action: "deactivate_user"`
- ✅ Usuário não consegue fazer login no Lovable até ser reativado

### Como verificar:
```sql
-- Ver log no banco local
SELECT * FROM integration_logs 
WHERE action = 'deactivate_user' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🗑️ Teste 2: Excluir Usuário

### ⚠️ CUIDADO: Esta ação é IRREVERSÍVEL!

### Passo a Passo:
1. Clique no ícone **🗑️ vermelho** de um usuário de teste
2. Aparecerá um modal com:
   - Título: "Excluir Usuário"
   - **Aviso vermelho**: "⚠️ ATENÇÃO: Esta ação é irreversível!"
   - Email do usuário
   - Descrição: "Todos os dados serão removidos permanentemente"
3. Clique em **"Sim, Excluir Permanentemente"**
4. Aguarde a mensagem: "🗑️ Usuário [email] foi excluído permanentemente"
5. A lista de usuários será atualizada automaticamente (usuário sumirá)

### O que acontece:
- ✅ Usuário é REMOVIDO do Lovable
- ✅ Todos os dados do usuário são apagados
- ✅ Log registrado no banco com `action: "delete_user"`
- ✅ Não há como desfazer

### Como verificar:
```sql
-- Ver log no banco local
SELECT * FROM integration_logs 
WHERE action = 'delete_user' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 📋 Teste 3: Verificar Logs

### Acesse a página de logs:
```
http://localhost:3000/admin/lovable/emails
```

### Você verá:
- ✅ Action: `deactivate_user` com status `success`
- ✅ Action: `delete_user` com status `success`
- ✅ Timestamps corretos
- ✅ User ID e email registrados
- ✅ HTTP Status Code: 200

---

## 🔍 Cenários de Erro para Testar

### Erro 1: Servidor Lovable Offline
- **Simule**: Altere temporariamente a URL da Edge Function
- **Resultado Esperado**: Toast vermelho com "❌ Erro ao desativar usuário"
- **Log**: `status: "error"` com mensagem de erro

### Erro 2: API Secret Inválido
- **Simule**: Altere temporariamente o `API_SECRET`
- **Resultado Esperado**: Toast vermelho com "❌ Erro ao desativar usuário"
- **Log**: `status: "error"` com HTTP 401 ou 403

### Erro 3: User ID Inexistente
- **Simule**: Via Postman/Insomnia, envie userId fake
- **Resultado Esperado**: Erro 400 com mensagem clara

---

## 🧰 Ferramentas de Debug

### 1. Console do Navegador
```javascript
// Abra DevTools (F12) e veja os logs:
// ✅ Requisição PATCH/DELETE sendo enviada
// ✅ Response JSON com success: true
// ✅ Lista de usuários sendo recarregada
```

### 2. Terminal do Servidor
```bash
# Você verá logs como:
🔒 Desativando usuário: abc123-def456
✅ Usuário desativado com sucesso

🗑️ Excluindo usuário: abc123-def456
✅ Usuário excluído com sucesso
```

### 3. Network Tab (DevTools)
```
PATCH /api/lovable/users
Request Payload:
{
  "userId": "abc123-def456",
  "action": "ban"
}

Response:
{
  "success": true,
  "message": "Usuário desativado com sucesso"
}
```

---

## ✅ Checklist de Validação

Marque conforme testar:

### Interface
- [ ] Botões aparecem corretamente (azul, amarelo, vermelho)
- [ ] Ícones corretos (🔑, 🚫, 🗑️)
- [ ] Hover nos botões muda cor
- [ ] Título (title) aparece ao passar mouse

### Modal de Desativar
- [ ] Abre ao clicar no botão amarelo
- [ ] Mostra email do usuário correto
- [ ] Botão "Cancelar" fecha modal sem fazer nada
- [ ] Botão "Sim, Desativar" fica desabilitado durante loading
- [ ] Spinner aparece durante processo
- [ ] Modal fecha após sucesso

### Modal de Excluir
- [ ] Abre ao clicar no botão vermelho
- [ ] Mostra aviso vermelho grande
- [ ] Mostra email do usuário correto
- [ ] Botão "Cancelar" fecha modal sem fazer nada
- [ ] Botão "Sim, Excluir" fica desabilitado durante loading
- [ ] Spinner aparece durante processo
- [ ] Modal fecha após sucesso

### Funcionalidade
- [ ] Desativar realmente bloqueia usuário no Lovable
- [ ] Excluir realmente remove usuário do Lovable
- [ ] Lista de usuários atualiza automaticamente após ação
- [ ] Toast de sucesso aparece (verde com ✅)
- [ ] Toast de erro aparece se falhar (vermelho com ❌)
- [ ] Logs são registrados corretamente no banco

### Performance
- [ ] Ações são rápidas (< 2 segundos)
- [ ] Não há travamentos na interface
- [ ] Lista atualiza suavemente
- [ ] Não há erros no console

---

## 🐛 Problemas Comuns

### "Erro ao desativar usuário"
**Causa**: Edge Function não está respondendo
**Solução**: Verifique se a URL está correta em `.env.local`

### "Usuário não foi removido da lista"
**Causa**: Lista não atualizou
**Solução**: Clique no botão "Atualizar" manualmente

### "Modal não abre"
**Causa**: Estado do React não foi atualizado
**Solução**: Recarregue a página (F5)

### "Botão não faz nada"
**Causa**: JavaScript não carregou
**Solução**: Verifique console (F12) por erros

---

## 🎯 Resultado Esperado

Após todos os testes:

✅ **Desativar Usuário**:
- Modal amarelo funciona
- Usuário bloqueado no Lovable
- Log registrado
- Toast de sucesso

✅ **Excluir Usuário**:
- Modal vermelho funciona
- Usuário removido do Lovable
- Log registrado
- Toast de sucesso
- Usuário some da lista

✅ **Logs**:
- Todas ações aparecem em `/admin/lovable/emails`
- Status `success`
- Timestamps corretos
- Detalhes completos

---

## 📞 Suporte

Se algo não funcionar:

1. **Verifique o console do navegador** (F12)
2. **Verifique o terminal do servidor**
3. **Confira os logs no banco** (`integration_logs`)
4. **Teste com outro usuário**
5. **Recarregue a página** (Ctrl+Shift+R)

---

## 🎉 Tudo Funcionando?

Se todos os testes passarem, você tem:
- ✅ Sistema completo de gerenciamento de usuários
- ✅ Desativar/Reativar funcional
- ✅ Excluir com confirmação
- ✅ Logs de auditoria completos
- ✅ Interface intuitiva e segura

**Parabéns! Sistema pronto para uso! 🚀**
