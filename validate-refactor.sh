#!/bin/bash

# =============================================
# SCRIPT DE VALIDAÇÃO - Dashboard Analytics
# =============================================
# Execute este script para validar o refactor
# Usage: ./validate-refactor.sh
# =============================================

set -e  # Exit on error

echo "🎯 VALIDAÇÃO DO REFACTOR - Dashboard Analytics"
echo "=============================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

# Função de teste
test_file() {
  local file=$1
  local description=$2
  
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ PASS${NC} - $description"
    ((PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC} - $description (arquivo não encontrado: $file)"
    ((FAILED++))
  fi
}

echo "📁 VERIFICANDO ARQUIVOS MODIFICADOS..."
echo "--------------------------------------"

test_file "lib/dashboard-queries.ts" "Queries refatoradas"
test_file "lib/useAnalytics.ts" "Hook de tracking"
test_file "lib/types/analytics.ts" "TypeScript types"
test_file "components/dashboard/BigNumbers.tsx" "Componente BigNumbers"
test_file "components/dashboard/RealtimeVisitors.tsx" "Componente RealtimeVisitors"

echo ""
echo "📚 VERIFICANDO DOCUMENTAÇÃO..."
echo "--------------------------------------"

test_file "REFACTOR-README.md" "README principal"
test_file "docs/RESUMO-REFACTOR.md" "Resumo executivo"
test_file "docs/REFACTOR-DASHBOARD-COMPLETO.md" "Guia completo"
test_file "docs/CHECKLIST-VALIDACAO.md" "Checklist de validação"
test_file "docs/ANTES-DEPOIS.md" "Comparação antes/depois"
test_file "docs/INDEX.md" "Índice de documentação"
test_file "docs/examples/dashboard-analytics-example.tsx" "Exemplo de código"
test_file "database/DEBUG-QUERIES.sql" "Queries de debug"

echo ""
echo "🔍 VERIFICANDO SINTAXE TYPESCRIPT..."
echo "--------------------------------------"

# Verificar se há erros de TypeScript
if command -v npx &> /dev/null; then
  if npx tsc --noEmit --skipLibCheck 2>&1 | grep -q "error"; then
    echo -e "${RED}❌ FAIL${NC} - Erros de TypeScript encontrados"
    ((FAILED++))
  else
    echo -e "${GREEN}✅ PASS${NC} - Nenhum erro de TypeScript"
    ((PASSED++))
  fi
else
  echo -e "${YELLOW}⚠️  SKIP${NC} - TypeScript não instalado (npx não encontrado)"
fi

echo ""
echo "🔎 VERIFICANDO CÓDIGO..."
echo "--------------------------------------"

# Verificar se fetchSalesWithFallback foi removido
if grep -r "fetchSalesWithFallback" lib/ 2>/dev/null; then
  echo -e "${RED}❌ FAIL${NC} - fetchSalesWithFallback ainda existe (deveria ter sido removido)"
  ((FAILED++))
else
  echo -e "${GREEN}✅ PASS${NC} - fetchSalesWithFallback removido"
  ((PASSED++))
fi

# Verificar se as novas queries existem
if grep -q "fetchDashboardMetrics" lib/dashboard-queries.ts; then
  echo -e "${GREEN}✅ PASS${NC} - fetchDashboardMetrics existe"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC} - fetchDashboardMetrics não encontrado"
  ((FAILED++))
fi

if grep -q "fetchSalesBySource" lib/dashboard-queries.ts; then
  echo -e "${GREEN}✅ PASS${NC} - fetchSalesBySource existe"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC} - fetchSalesBySource não encontrado"
  ((FAILED++))
fi

if grep -q "fetchTopProducts" lib/dashboard-queries.ts; then
  echo -e "${GREEN}✅ PASS${NC} - fetchTopProducts existe"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC} - fetchTopProducts não encontrado"
  ((FAILED++))
fi

# Verificar se UTMs estão sendo capturados
if grep -q "utm_source" lib/useAnalytics.ts; then
  echo -e "${GREEN}✅ PASS${NC} - UTMs sendo capturados"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC} - UTMs não estão sendo capturados"
  ((FAILED++))
fi

# Verificar se device_type está sendo capturado
if grep -q "device_type" lib/useAnalytics.ts; then
  echo -e "${GREEN}✅ PASS${NC} - Device type sendo capturado"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC} - Device type não está sendo capturado"
  ((FAILED++))
fi

# Verificar se referrer_domain está sendo capturado
if grep -q "referrer_domain" lib/useAnalytics.ts; then
  echo -e "${GREEN}✅ PASS${NC} - Referrer domain sendo capturado"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC} - Referrer domain não está sendo capturado"
  ((FAILED++))
fi

# Verificar se console.log foi removido do heartbeat
if grep -A 10 "sendHeartbeat" lib/useAnalytics.ts | grep -q "console.log.*heartbeat enviado"; then
  echo -e "${YELLOW}⚠️  WARN${NC} - console.log encontrado no heartbeat (deveria ser removido)"
else
  echo -e "${GREEN}✅ PASS${NC} - console.log removido do heartbeat"
  ((PASSED++))
fi

echo ""
echo "📊 VERIFICANDO TYPES..."
echo "--------------------------------------"

# Verificar se os types foram criados
if grep -q "AnalyticsHealth" lib/types/analytics.ts; then
  echo -e "${GREEN}✅ PASS${NC} - Type AnalyticsHealth existe"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC} - Type AnalyticsHealth não encontrado"
  ((FAILED++))
fi

if grep -q "MarketingAttribution" lib/types/analytics.ts; then
  echo -e "${GREEN}✅ PASS${NC} - Type MarketingAttribution existe"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC} - Type MarketingAttribution não encontrado"
  ((FAILED++))
fi

if grep -q "ProductPerformance" lib/types/analytics.ts; then
  echo -e "${GREEN}✅ PASS${NC} - Type ProductPerformance existe"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC} - Type ProductPerformance não encontrado"
  ((FAILED++))
fi

echo ""
echo "=============================================="
echo "📊 RESULTADO FINAL"
echo "=============================================="
echo -e "${GREEN}✅ Testes passados: $PASSED${NC}"
echo -e "${RED}❌ Testes falhados: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 SUCESSO! Todos os testes passaram!${NC}"
  echo ""
  echo "Próximos passos:"
  echo "1. Leia REFACTOR-README.md"
  echo "2. Execute o checklist em docs/CHECKLIST-VALIDACAO.md"
  echo "3. Teste manualmente no navegador"
  echo "4. Valide as Views SQL no Supabase"
  echo ""
  exit 0
else
  echo -e "${RED}⚠️  ATENÇÃO! Alguns testes falharam.${NC}"
  echo ""
  echo "Corrija os erros antes de prosseguir:"
  echo "- Verifique se todos os arquivos foram criados/modificados"
  echo "- Consulte docs/CHECKLIST-VALIDACAO.md para detalhes"
  echo ""
  exit 1
fi
