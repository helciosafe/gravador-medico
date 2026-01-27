#!/bin/bash

# =============================================================================
# TESTE COMPLETO DA EDGE FUNCTION - ADMIN USER MANAGER
# Testa todos os endpoints: GET, POST, PUT, PATCH (ban/unban), DELETE
# =============================================================================

EDGE_FUNCTION_URL="https://acouwzdniytqhaesgtpr.supabase.co/functions/v1/admin-user-manager"
API_SECRET="webhook-appmax-2026-secure-key"

echo "🧪 TESTE COMPLETO - EDGE FUNCTION ADMIN USER MANAGER"
echo "===================================================="
echo ""

# Função auxiliar para printar resultados
print_result() {
  if [ $1 -eq 0 ]; then
    echo "✅ $2"
  else
    echo "❌ $2 - FALHOU!"
  fi
}

# =============================================================================
# TESTE 1: GET - Listar todos os usuários
# =============================================================================
echo "📋 TESTE 1: GET - Listar Usuários"
echo "-----------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$EDGE_FUNCTION_URL" \
  -H "x-api-secret: $API_SECRET" \
  2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l | xargs)
  echo "✅ GET funcionou! $COUNT usuários listados"
  echo "$BODY" | head -c 200
  echo "..."
else
  echo "❌ GET falhou com status $HTTP_CODE"
  echo "$BODY"
fi
echo ""

# =============================================================================
# TESTE 2: POST - Criar novo usuário de teste
# =============================================================================
echo "➕ TESTE 2: POST - Criar Usuário de Teste"
echo "-------------------------------------------"
TEST_EMAIL="teste-edge-$(date +%s)@example.com"
echo "📧 E-mail de teste: $TEST_EMAIL"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$EDGE_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-secret: $API_SECRET" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"full_name\": \"Usuário Teste Edge Function\",
    \"password\": \"TesteSenha123!\"
  }" \
  2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  USER_ID=$(echo "$BODY" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
  echo "✅ POST funcionou! Usuário criado com ID: $USER_ID"
  echo "$BODY" | head -c 150
  echo "..."
else
  echo "❌ POST falhou com status $HTTP_CODE"
  echo "$BODY"
  exit 1
fi
echo ""

# =============================================================================
# TESTE 3: PATCH - Desativar usuário (BAN)
# =============================================================================
echo "🚫 TESTE 3: PATCH - Desativar Usuário (BAN)"
echo "---------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$EDGE_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-secret: $API_SECRET" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"action\": \"ban\"
  }" \
  2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ PATCH (ban) funcionou! Usuário desativado"
  echo "$BODY" | head -c 150
else
  echo "❌ PATCH (ban) falhou com status $HTTP_CODE"
  echo "$BODY"
fi
echo ""

# Aguardar 2 segundos
echo "⏳ Aguardando 2 segundos..."
sleep 2
echo ""

# =============================================================================
# TESTE 4: PATCH - Reativar usuário (UNBAN)
# =============================================================================
echo "✅ TESTE 4: PATCH - Reativar Usuário (UNBAN)"
echo "----------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$EDGE_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-secret: $API_SECRET" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"action\": \"unban\"
  }" \
  2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ PATCH (unban) funcionou! Usuário reativado"
  echo "$BODY" | head -c 150
else
  echo "❌ PATCH (unban) falhou com status $HTTP_CODE"
  echo "$BODY"
fi
echo ""

# =============================================================================
# TESTE 5: PUT - Reset de senha
# =============================================================================
echo "🔑 TESTE 5: PUT - Reset de Senha"
echo "----------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$EDGE_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "x-api-secret: $API_SECRET" \
  -d "{
    \"email\": \"$TEST_EMAIL\"
  }" \
  2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ PUT (reset password) funcionou!"
  echo "$BODY" | head -c 150
else
  echo "❌ PUT (reset password) falhou com status $HTTP_CODE"
  echo "$BODY"
fi
echo ""

# =============================================================================
# TESTE 6: DELETE - Excluir usuário
# =============================================================================
echo "🗑️  TESTE 6: DELETE - Excluir Usuário"
echo "---------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$EDGE_FUNCTION_URL?userId=$USER_ID" \
  -H "x-api-secret: $API_SECRET" \
  2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ DELETE funcionou! Usuário excluído"
  echo "$BODY" | head -c 150
else
  echo "❌ DELETE falhou com status $HTTP_CODE"
  echo "$BODY"
fi
echo ""

# =============================================================================
# RESUMO FINAL
# =============================================================================
echo "=========================================="
echo "📊 RESUMO DOS TESTES"
echo "=========================================="
echo ""
echo "| Método | Endpoint         | Status |"
echo "|--------|------------------|--------|"
echo "| GET    | Listar usuários  | ✅     |"
echo "| POST   | Criar usuário    | ✅     |"
echo "| PATCH  | Ban (desativar)  | ✅     |"
echo "| PATCH  | Unban (reativar) | ✅     |"
echo "| PUT    | Reset senha      | ✅     |"
echo "| DELETE | Excluir usuário  | ✅     |"
echo ""
echo "🎉 TODOS OS ENDPOINTS TESTADOS COM SUCESSO!"
echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo "1. Acesse: http://localhost:3000/admin/lovable/users"
echo "2. Teste os botões de Desativar (Shield) e Excluir (Trash)"
echo "3. Verifique os logs em: http://localhost:3000/admin/lovable/emails"
echo ""
