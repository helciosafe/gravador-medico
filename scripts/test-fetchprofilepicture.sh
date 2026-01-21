#!/bin/bash

# ================================================================
# Script de Teste - POST /chat/fetchProfilePicture (Evolution v2)
# ================================================================
# Método OFICIAL da Evolution v2 para buscar fotos de perfil
# ================================================================

EVOLUTION_API_URL="https://evolution-api-production-eb21.up.railway.app"
API_KEY="Beagle3005"
INSTANCE_NAME="whatsapp-principal"

# ================================================================
# CONFIGURAÇÃO: Coloque um número de teste real aqui
# Formato: APENAS O NÚMERO (sem @s.whatsapp.net)
# Exemplo: 5521988960217
# ================================================================
PHONE_NUMBER="${1:-5521988960217}"

echo "════════════════════════════════════════════════════════════"
echo "🧪 TESTE: POST /chat/fetchProfilePicture (Evolution v2)"
echo "════════════════════════════════════════════════════════════"
echo "Instance: $INSTANCE_NAME"
echo "Phone Number: $PHONE_NUMBER"
echo ""

# Montar URL
URL="${EVOLUTION_API_URL}/chat/fetchProfilePicture/${INSTANCE_NAME}"

echo "📡 URL:"
echo "$URL"
echo ""
echo "📦 Body JSON:"
echo "{\"number\": \"$PHONE_NUMBER\"}"
echo ""
echo "────────────────────────────────────────────────────────────"
echo "📥 Enviando Request..."
echo "────────────────────────────────────────────────────────────"

# Fazer request POST com timeout de 10 segundos
RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 10 -X POST "$URL" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"number\": \"$PHONE_NUMBER\"}")

# Separar corpo e status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo ""
echo "📥 Resposta JSON:"
echo "────────────────────────────────────────────────────────────"

# Exibir resultado formatado
if command -v jq &> /dev/null; then
  echo "$HTTP_BODY" | jq '.'
else
  echo "$HTTP_BODY"
fi

echo ""
echo "────────────────────────────────────────────────────────────"
echo "📊 Status HTTP: $HTTP_CODE"
echo "────────────────────────────────────────────────────────────"

# Verificar resultado
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "✅ SUCESSO! Endpoint funcionando"
  echo ""
  echo "📝 Campo esperado na resposta:"
  echo "   - profilePictureUrl (campo oficial)"
  
  # Tentar extrair URL da foto se tiver jq
  if command -v jq &> /dev/null; then
    PHOTO=$(echo "$HTTP_BODY" | jq -r '.profilePictureUrl // .profilePicUrl // .url // .picture // "null"')
    
    if [ "$PHOTO" != "null" ] && [ -n "$PHOTO" ]; then
      echo ""
      echo "🖼️  FOTO DE PERFIL ENCONTRADA:"
      echo "────────────────────────────────────────────────────────────"
      echo "$PHOTO"
      echo "────────────────────────────────────────────────────────────"
      echo ""
      echo "✅ Esta URL será salva em whatsapp_contacts.profile_picture_url"
    else
      echo ""
      echo "⚠️  Resposta recebida mas SEM foto de perfil"
      echo "    Possíveis causas:"
      echo "    - Usuário não tem foto de perfil configurada"
      echo "    - Privacidade bloqueando acesso à foto"
      echo "    - Número não está no WhatsApp"
    fi
  fi
else
  echo "❌ ERRO! Status HTTP $HTTP_CODE"
  echo ""
  echo "📋 Corpo da resposta de erro:"
  echo "$HTTP_BODY"
  echo ""
  echo "💡 Possíveis causas:"
  echo "   - API Key inválida ou expirada"
  echo "   - Instance não está conectada ao WhatsApp"
  echo "   - Número em formato incorreto (use apenas dígitos)"
  echo "   - Endpoint não existe nesta versão da Evolution"
  echo "   - Permissões insuficientes"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Teste concluído!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📖 Uso:"
echo "   ./test-fetchprofilepicture.sh                  # Usa número padrão"
echo "   ./test-fetchprofilepicture.sh 5521988960217    # Número específico"
echo ""
echo "🔍 Formato do número:"
echo "   - APENAS dígitos (sem espaços, parênteses ou hífens)"
echo "   - Código do país + DDD + número"
echo "   - Exemplos: 5521988960217, 5511999999999"
echo "   - NÃO incluir: @s.whatsapp.net"
echo ""
