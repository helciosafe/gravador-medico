#!/bin/bash

# ================================================================
# Script de Teste: POST /chat/findContacts (VALIDADO)
# Este é o endpoint correto que retorna profilePicUrl
# ================================================================

EVOLUTION_API_URL="https://evolution-api-production-eb21.up.railway.app"
INSTANCE_NAME="whatsapp-principal"
API_KEY="Beagle3005"

# Número de telefone para testar (sem @s.whatsapp.net)
PHONE_NUMBER="${1:-5521988960217}"

echo "📸 ===== TESTE POST /chat/findContacts (CORRETO) ====="
echo "📸 URL: ${EVOLUTION_API_URL}/chat/findContacts/${INSTANCE_NAME}"
echo "📸 Método: POST"
echo "📸 Body: {\"number\": \"${PHONE_NUMBER}\"}"
echo "📸 API Key: ${API_KEY:0:3}***${API_KEY: -4}"
echo ""

curl -v -X POST \
  "${EVOLUTION_API_URL}/chat/findContacts/${INSTANCE_NAME}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"number\": \"${PHONE_NUMBER}\"}" | jq '.'

echo ""
echo "📸 ========================================"
echo "📸 VALIDAÇÃO:"
echo "📸 ✅ Se retornar array com profilePicUrl"
echo "📸 ❌ Se der 404 ou array vazio"
echo "📸 ========================================"
