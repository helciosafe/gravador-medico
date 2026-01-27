#!/bin/bash

# =====================================================
# SCRIPT DE TESTE: Edge Function Endpoints
# =====================================================
# Testa quais endpoints estão disponíveis na Edge Function
# =====================================================

EDGE_FUNCTION_URL="https://acouwzdniytqhaesgtpr.supabase.co/functions/v1/admin-user-manager"
API_SECRET="webhook-appmax-2026-secure-key"

echo "🧪 Testando Edge Function: admin-user-manager"
echo "================================================"
echo ""

# Teste 1: GET (listar usuários)
echo "1️⃣  Testando GET (listar usuários)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$EDGE_FUNCTION_URL" \
  -H "x-api-secret: $API_SECRET" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ GET está funcionando (200 OK)"
else
  echo "   ❌ GET retornou: $HTTP_CODE"
fi
echo ""

# Teste 2: PATCH (desativar usuário)
echo "2️⃣  Testando PATCH (desativar usuário)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$EDGE_FUNCTION_URL" \
  -H "x-api-secret: $API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-id","action":"ban"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ] && echo "$BODY" | grep -q "user not found\|User not found\|userId"; then
  echo "   ✅ PATCH está implementado (erro esperado para userId fake)"
  echo "   Resposta: $BODY"
elif [ "$HTTP_CODE" = "405" ]; then
  echo "   ❌ PATCH NÃO IMPLEMENTADO (405 Method Not Allowed)"
  echo "   🚨 VOCÊ PRECISA ATUALIZAR A EDGE FUNCTION!"
elif [ "$HTTP_CODE" = "200" ]; then
  echo "   ⚠️  PATCH retornou 200 (não deveria com userId fake)"
else
  echo "   ⚠️  PATCH retornou: $HTTP_CODE"
  echo "   Resposta: $BODY"
fi
echo ""

# Teste 3: DELETE (excluir usuário)
echo "3️⃣  Testando DELETE (excluir usuário)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$EDGE_FUNCTION_URL?userId=test-user-id" \
  -H "x-api-secret: $API_SECRET" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ] && echo "$BODY" | grep -q "user not found\|User not found\|userId"; then
  echo "   ✅ DELETE está implementado (erro esperado para userId fake)"
  echo "   Resposta: $BODY"
elif [ "$HTTP_CODE" = "405" ]; then
  echo "   ❌ DELETE NÃO IMPLEMENTADO (405 Method Not Allowed)"
  echo "   🚨 VOCÊ PRECISA ATUALIZAR A EDGE FUNCTION!"
elif [ "$HTTP_CODE" = "200" ]; then
  echo "   ⚠️  DELETE retornou 200 (não deveria com userId fake)"
else
  echo "   ⚠️  DELETE retornou: $HTTP_CODE"
  echo "   Resposta: $BODY"
fi
echo ""

# Resumo
echo "================================================"
echo "📊 RESUMO DO TESTE"
echo "================================================"
echo ""
echo "Se você viu '❌ NÃO IMPLEMENTADO' acima:"
echo "👉 Leia o arquivo: ATUALIZAR-EDGE-FUNCTION.md"
echo "👉 Atualize a Edge Function no Lovable"
echo "👉 Rode este script novamente"
echo ""
echo "Se viu '✅ está implementado' em tudo:"
echo "👉 Edge Function está OK!"
echo "👉 O erro pode ser outra coisa"
echo ""
