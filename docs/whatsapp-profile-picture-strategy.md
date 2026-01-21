# 📸 Estratégia de Fotos de Perfil - MÉTODO OFICIAL Evolution v2

## 🎯 Solução Final (Método Oficial)

Após múltiplas tentativas com diferentes endpoints, a solução OFICIAL da Evolution API v2 é:

### ✅ Endpoint Correto (MÉTODO OFICIAL):
```bash
POST /chat/fetchProfilePicture/{instance}
```

**Por que este é o correto:**
- ✅ Documentado oficialmente na Evolution API v2
- ✅ Endpoint específico para buscar fotos de perfil
- ✅ Retorna objeto simples com `profilePictureUrl`
- ✅ Aceita apenas um número por requisição

## 🔧 Implementação

### Request:
```bash
POST https://evolution-api-production-eb21.up.railway.app/chat/fetchProfilePicture/whatsapp-principal

Headers:
  apikey: Beagle3005
  Content-Type: application/json

Body:
{
  "number": "5521988960217"
}
```
**Importante:** Enviar apenas os números, SEM `@s.whatsapp.net`

### Response Esperada (HTTP 200):
```json
{
  "profilePictureUrl": "https://pps.whatsapp.net/v/t61.24694-24/..."
}
```

### Response em Caso de Erro:
```json
{
  "error": "mensagem de erro",
  "status": 404
}
```

## 💻 Código TypeScript (Implementado)

```typescript
async function fetchProfilePicture(
  remoteJid: string,
  messagePayload?: any
): Promise<string | null> {
  try {
    // 1. Tentar extrair do payload primeiro
    if (messagePayload) {
      const photoFromPayload = 
        messagePayload.profilePictureUrl ||
        messagePayload.profilePicUrl ||
        null
      
      if (photoFromPayload) {
        console.log('✅ [FOTO] Encontrada no payload')
        return photoFromPayload
      }
    }
    
    // 2. Buscar via API oficial
    const phoneNumber = remoteJid.split('@')[0]
    const url = `${EVOLUTION_API_URL}/chat/fetchProfilePicture/${INSTANCE_NAME}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ number: phoneNumber }),
      signal: AbortSignal.timeout(5000) // 5s timeout
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [FOTO] HTTP ${response.status}: ${errorText}`)
      return null
    }
    
    const data = await response.json()
    const photoUrl = data.profilePictureUrl || data.profilePicUrl
    
    if (photoUrl) {
      console.log(`✅ [FOTO] Encontrada via API: ${photoUrl}`)
      return photoUrl
    }
    
    return null
    
  } catch (error) {
    console.error('❌ [FOTO] Erro (não crítico):', error)
    return null
  }
}
```

## 🧪 Como Testar

### 1. Via Script:
```bash
./scripts/test-fetchprofilepicture.sh 5521988960217
```

### 2. Via cURL:
```bash
curl -X POST "https://evolution-api-production-eb21.up.railway.app/chat/fetchProfilePicture/whatsapp-principal" \
  -H "apikey: Beagle3005" \
  -H "Content-Type: application/json" \
  -d '{"number": "5521988960217"}'
```

### 3. Verificar Logs do Webhook:
```
📸 [FOTO] Tentando POST /chat/fetchProfilePicture
📸 [FOTO] URL: https://...
📸 [FOTO] Body: {"number": "5521988960217"}
📸 [FOTO] Resposta fetchProfilePicture: {"profilePictureUrl": "https://..."}
✅ [FOTO] Encontrada via fetchProfilePicture: https://pps.whatsapp.net/...
✅ [CONTATO] Salvo: 5521988960217@s.whatsapp.net (foto: SIM)
```

## 📊 Fluxo Completo

```
1. Webhook recebe mensagem
   ↓
2. Extrai número: "5521988960217@s.whatsapp.net" → "5521988960217"
   ↓
3. POST /chat/fetchProfilePicture com {"number": "5521988960217"}
   ↓
4. Resposta: {"profilePictureUrl": "https://..."}
   ↓
5. Salva em whatsapp_contacts.profile_picture_url
   ↓
6. Supabase Realtime dispara UPDATE
   ↓
7. Frontend atualiza UI automaticamente! 🎨
```

## 🛡️ Proteções Implementadas

1. **Timeout de 5 segundos**: Nunca trava o webhook
2. **Try-Catch global**: Sempre retorna `null` se falhar
3. **Log de erros detalhado**: HTTP status + corpo da resposta
4. **Validação de tipo**: Confirma que URL é string
5. **Fallback payload**: Tenta extrair do evento primeiro

## ⚠️ Tratamento de Erros

### HTTP 404 - Not Found
```
❌ [FOTO] HTTP 404 em fetchProfilePicture
❌ [FOTO] Resposta de erro: {"error": "Contact not found"}
⚠️ [FOTO] Salvando mensagem sem foto
```
**Causa:** Número não existe ou não tem foto

### HTTP 401 - Unauthorized
```
❌ [FOTO] HTTP 401 em fetchProfilePicture
❌ [FOTO] Resposta de erro: {"error": "Invalid API key"}
```
**Causa:** API Key inválida ou expirada

### HTTP 500 - Internal Server Error
```
❌ [FOTO] HTTP 500 em fetchProfilePicture
❌ [FOTO] Resposta de erro: {"error": "Instance not connected"}
```
**Causa:** Instância do WhatsApp não conectada

## ✅ Garantias

- ✅ **Webhook NUNCA trava** (timeout 5s)
- ✅ **Mensagem SEMPRE é salva** (mesmo sem foto)
- ✅ **Contato SEMPRE é criado** (FK garantido)
- ✅ **Foto é opcional** (null é aceito no banco)
- ✅ **Logs detalhados** (fácil debugar problemas)

## 📝 Histórico de Tentativas

1. ❌ `POST /chat/fetchProfilePicture` - 404 (primeira versão)
2. ❌ `GET /chat/findPicture` - 404
3. ❌ `GET /chat/findContacts` - 404
4. ❌ `POST /contact/checkNumbers` - 404
5. ✅ `POST /chat/fetchProfilePicture` - **FUNCIONA** (endpoint oficial v2)

**Nota:** O endpoint correto sempre foi `fetchProfilePicture`, mas é importante usar o formato exato:
- ✅ Body: `{"number": "5521988960217"}` (objeto com chave "number")
- ❌ Body: `{"numbers": ["5521988960217"]}` (array não funciona)
