# 🎙️ Voice Pen Pro - Gravador Médico Profissional# 🩺 Voice Pen Pro - Gravador Médico# Voice Pen Pro - Dashboard Médico



> Sistema completo de E-commerce SaaS com Dashboard Analytics avançado para venda de gravadores médicos profissionais.



[![Next.js](https://img.shields.io/badge/Next.js-15.5.9-black?logo=next.js)](https://nextjs.org/)> Plataforma completa de gravação e transcrição médica com IA + Sistema de vendas e analyticsPlataforma profissional de gravação e transcrição médica com IA + Sistema completo de vendas e analytics.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)

[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)

[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()[![Deploy](https://img.shields.io/badge/deploy-vercel-black)](https://www.gravadormedico.com.br)## 🚀 Tecnologias



---[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)



## 📋 Índice[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)- **Next.js 15** (App Router)



- [Sobre](#-sobre-o-projeto)- **React 18** + **TypeScript**

- [Features](#-features)

- [Tech Stack](#-tech-stack)## 🚀 Stack Tecnológico- **Tailwind CSS** + **Framer Motion**

- [Estrutura](#-estrutura-do-projeto)

- [Instalação](#-instalação)- **Supabase** (Database + Auth + RLS)

- [Uso](#-uso)

- [Dashboard Analytics](#-dashboard-analytics)- **Framework:** Next.js 15 (App Router) + React 18- **AppMax API** (Checkout + Webhooks)

- [Deploy](#-deploy)

- [Documentação](#-documentação)- **Linguagem:** TypeScript 5.7- **Meta Conversions API** (CAPI)



---- **Estilo:** Tailwind CSS + Framer Motion- **Lucide Icons** + **shadcn/ui**



## 🎯 Sobre o Projeto- **Banco de Dados:** Supabase (PostgreSQL + Auth + RLS)



**Voice Pen Pro** é uma plataforma completa de e-commerce especializada em gravadores médicos profissionais com:- **Pagamento:** AppMax API + Webhooks## 📁 Estrutura do Projeto



- 🛒 **E-commerce completo** com carrinho e checkout otimizado- **Analytics:** Meta Conversions API (CAPI)

- 📊 **Dashboard Analytics** com métricas em tempo real (10x mais rápido)

- 🔐 **Área administrativa** com CRM integrado- **UI:** Lucide Icons + shadcn/ui + Recharts```

- 💳 **Integração MercadoPago** e AppMax

- 📈 **Marketing Attribution** (UTMs, fontes de tráfego)gravador-medico/

- 🎨 **UI/UX moderna** com animações e efeitos visuais

## 📁 Estrutura do Projeto├── app/               # Next.js App Router

---

│   ├── admin/         # Painel admin (12 páginas)

## ✨ Features

```│   └── api/           # API Routes

### 🛍️ E-commerce

✅ Catálogo de produtos dinâmico  gravador-medico/├── components/        # 44 componentes React

✅ Carrinho de compras persistente  

✅ Checkout em múltiplas etapas  ├── app/                    # Next.js App Router├── lib/              # Utils e helpers

✅ Integração MercadoPago (Pix, Cartão)  

✅ Webhooks para sincronização de pedidos  │   ├── admin/             # Painel administrativo├── database/         # SQL migrations + schemas



### 📊 Dashboard Analytics (⚡ REFATORADO)│   │   ├── dashboard/     # Dashboard principal├── docs/             # Documentação consolidada

✅ Métricas em tempo real (receita, vendas, conversão)  

✅ Visitantes online (atualização a cada 5s)  │   │   ├── analytics/     # Analytics avançado├── scripts/          # Automação e deploy

✅ Marketing Attribution (Google, Facebook, UTMs)  

✅ Funil de conversão completo  │   │   ├── sales/         # Gestão de vendas└── public/           # Assets estáticos

✅ Performance de produtos  

✅ **Views SQL otimizadas (10x mais rápido)**  │   │   ├── customers/     # CRM de clientes```



### 👥 CRM & Admin│   │   ├── products/      # Produtos

✅ Gestão de clientes e contatos  

✅ Histórico de compras e notas  │   │   └── ...            # Outros módulosVer [CLEANUP-REPORT.md](./CLEANUP-REPORT.md) para detalhes da estrutura.

✅ Carrinhos abandonados  

✅ Recuperação de vendas  │   ├── api/               # API Routes

✅ Webhooks AppMax  

✅ Relatórios exportáveis  │   ├── checkout/          # Páginas de checkout## 📦 Instalação



---│   └── dashboard/         # Dashboard do usuário



## 🛠️ Tech Stack├── components/            # Componentes React```bash



### Frontend│   ├── ui/               # Componentes base (shadcn)# Instalar dependências

- **Next.js 15.5.9** - App Router + Server Components

- **TypeScript 5.0** - Type safety completo│   ├── modals/           # Modais interativosnpm install

- **Tailwind CSS** - Utility-first styling

- **Framer Motion** - Animações fluidas│   └── dashboard/        # Componentes do dashboard

- **Lucide Icons** - Ícones modernos

├── lib/                  # Utilidades e helpers# Configurar variáveis de ambiente

### Backend

- **Supabase** - PostgreSQL + Realtime + Auth├── database/             # Migrations e schemas SQLcp .env.example .env.local

- **Next.js API Routes** - Serverless functions

- **MercadoPago SDK** - Processamento de pagamentos├── docs/                 # Documentação organizada# Editar .env.local com suas credenciais

- **AppMax API** - Integração de e-commerce

│   ├── setup/           # Guias de instalação

### Database

- **PostgreSQL** - Banco de dados principal│   ├── features/        # Funcionalidades# Rodar em desenvolvimento

- **Views SQL** - Queries otimizadas (⚡ 10x faster)

- **Row Level Security** - Segurança nativa│   ├── integrations/    # Integrações (AppMax, Meta)npm run dev



---│   └── checkout/        # Documentação do checkout```



## 📁 Estrutura do Projeto└── scripts/             # Scripts de automação



``````**Acessos:**

gravador-medico/

├── app/                          # Next.js App Router- Site público: `http://localhost:3000`

│   ├── (routes)/

│   │   ├── page.tsx              # Homepage## ⚡ Quick Start- Painel admin: `http://localhost:3000/admin/dashboard`

│   │   ├── cart/                 # Carrinho

│   │   ├── checkout/             # Checkout- Login: `http://localhost:3000/login`

│   │   └── success/              # Páginas de sucesso

│   ├── admin/                    # Admin Dashboard### 1️⃣ Instalação

│   │   ├── dashboard/            # Visão geral

│   │   ├── analytics/            # Analytics avançado ⚡## 🎨 Funcionalidades Completas

│   │   ├── customers/            # Gestão de clientes

│   │   ├── sales/                # Vendas```bash

│   │   ├── crm/                  # CRM

│   │   └── ...# Clone o repositório### ✅ Implementadas:

│   └── api/                      # API Routes

│       ├── checkout/git clone https://github.com/mattosconsultor/gravador-medico.git

│       ├── webhooks/

│       └── analytics/cd gravador-medico#### **Dashboard Principal**

│

├── components/                   # Componentes React- Sidebar lateral com navegação completa

│   ├── dashboard/

│   │   ├── BigNumbers.tsx        # Métricas principais ⚡# Instale as dependências- Logo animado "Voice Pen Pro"

│   │   └── RealtimeVisitors.tsx  # Visitantes online

│   └── ui/npm install- Menu de navegação interativo

│

├── lib/                          # Bibliotecas```- Área VIP destacada (Loja de Prompts)

│   ├── dashboard-queries.ts      # Queries otimizadas ⚡

│   ├── useAnalytics.ts           # Hook de tracking- Barra de progresso animada (40% concluída)

│   ├── supabase.ts

│   └── types/### 2️⃣ Configuração- Grid de 4 cards interativos com hover effects

│       └── analytics.ts          # TypeScript types

│

├── database/                     # Scripts SQL

│   ├── schemas/```bash#### **Sistema de Modais Interativos**

│   │   └── supabase-analytics-advanced.sql  # Views ⚡

│   └── DEBUG-QUERIES.sql         # Queries de debug# Copie o arquivo de exemplo

│

├── docs/                         # Documentação 📚cp .env.example .env.local**1. SetupGuideModal** (Ver Guia)

│   ├── REFACTOR-DASHBOARD-COMPLETO.md

│   ├── CHECKLIST-VALIDACAO.md- Sistema de **3 ABAS** (Tabs):

│   └── examples/

│# Configure as variáveis de ambiente necessárias:  - **Aba Download**: QR Codes simulados para App Store e Play Store

├── REFACTOR-README.md            # Refactor Analytics

└── validate-refactor.sh          # Script de validação# - NEXT_PUBLIC_SUPABASE_URL  - **Aba Configuração**: 5 passos detalhados de setup

```

# - NEXT_PUBLIC_SUPABASE_ANON_KEY  - **Aba Concluir**: Mensagem de sucesso animada

---

# - JWT_SECRET- Animações de entrada/saída com Framer Motion

## 🚀 Instalação

# - APPMAX_API_TOKEN- Feedback visual ao completar configuração

### Pré-requisitos

- Node.js 18+# - etc.

- npm ou yarn

- Conta Supabase```**2. PremiumUnlockModal** (Produtos Premium)

- Conta MercadoPago

- Modal reutilizável com props dinâmicas

### Passo a Passo

### 3️⃣ Desenvolvimento- Exibe benefícios com checkmarks animados

```bash

# 1. Clone o repositório- Preço em destaque com desconto (40% OFF)

git clone https://github.com/mattosconsultor/gravador-medico.git

cd gravador-medico```bash- Badge de garantia de 7 dias



# 2. Instale as dependências# Inicie o servidor de desenvolvimento- Botão "Desbloquear Agora" com animação hover

npm install

npm run dev- Simulação de redirecionamento de pagamento

# 3. Configure .env.local

cp .env.example .env.local

# Edite com suas credenciais

# Acesse:#### **Interatividade dos Botões**

# 4. Execute as migrations SQL

# No Supabase SQL Editor:# - Site público: http://localhost:3000

# database/schemas/supabase-analytics-advanced.sql

# - Painel admin: http://localhost:3000/admin/dashboard**Card "Instalar Gravador"**

# 5. Inicie o servidor

npm run dev# - Login: http://localhost:3000/login- Botão "Ver Guia" → Abre SetupGuideModal

```

```- Navegação por abas funcionais

Abra [http://localhost:3000](http://localhost:3000)

- QR codes visuais para download

---

### 4️⃣ Build e Deploy

## 📖 Uso

**Card "Copiar Prompt Mestre"**

```bash

npm run dev       # Servidor desenvolvimento```bash- Botão "Copiar Agora" → Copia prompt SOAP completo

npm run build     # Build produção (✅ passing)

npm run start     # Servidor produção# Build de produção- Utiliza `navigator.clipboard.writeText()`

npm run lint      # Linter

```npm run build- Feedback visual: Botão muda para verde escuro



### Validar Refactor Analytics- Texto: "Copiado com Sucesso!" com ícone de check

```bash

./validate-refactor.sh# Deploy no Vercel- Reset automático após 3 segundos

```

vercel --prod- Toast notification de confirmação

---

```

## 📊 Dashboard Analytics (⚡ REFATORADO)

**Card "Prompt Cardiologia" (Bloqueado)**

### Performance

## 🎯 Funcionalidades Principais- Badge "Premium" em destaque

| Métrica | Antes | Depois | Ganho |

|---------|-------|--------|-------|- Botão "Desbloquear" → Abre PremiumUnlockModal

| **Tempo de load** | 2-5s | 200-500ms | **10x** ⚡ |

| **Tráfego** | 2.5MB | 15KB | **99.4%** 📉 |### 💼 Painel Administrativo- Exibe 6 benefícios específicos de cardiologia

| **Código** | 380 linhas | 15 linhas | **96%** 📉 |

- **Dashboard Analytics:** Métricas em tempo real, gráficos, KPIs- Preço: R$ 29,90 (desconto de R$ 49,90)

### Views SQL

- **Gestão de Vendas:** Controle completo de pedidos e transações- Ícone de coração vermelho personalizado

```typescript

import { fetchDashboardMetrics } from '@/lib/dashboard-queries'- **CRM:** Gerenciamento de clientes e histórico



const { data } = await fetchDashboardMetrics(supabase)- **Produtos:** Sincronização com AppMax**Card "Escudo Jurídico" (Bloqueado)**

// {

//   revenue: 45000,- **Recuperação:** Sistema de carrinhos abandonados- Badge "Proteção" em destaque

//   sales: 120,

//   conversion_rate: 3.5,- **Webhooks:** Monitoramento de integrações- Botão "Desbloquear" → Abre PremiumUnlockModal

//   revenue_change: 15.2  // % vs período anterior

// }- Exibe 6 benefícios de proteção legal (LGPD)

```

### 👤 Dashboard do Usuário- Preço: R$ 49,90

**Documentação:** `docs/REFACTOR-DASHBOARD-COMPLETO.md`

- **Gravador de Voz:** Transcrição médica com IA- Ícone de escudo azul personalizado

---

- **Biblioteca de Prompts:** Templates SOAP especializados

## 🚀 Deploy

- **Loja VIP:** Produtos e recursos premium#### **Animações (Framer Motion)**

### Vercel (Recomendado)

- **Perfil Médico:** Wizard de configuração- Fade-in sequencial dos cards

```bash

# 1. Conecte o repositório- Animação da barra de progresso

vercel

### 🛒 Sistema de Checkout- Transições suaves entre estados de botão

# 2. Configure variáveis de ambiente

# (copie do .env.local para Vercel Dashboard)- **Integração AppMax:** Gateway de pagamento completo- Animações de entrada dos modais



# 3. Deploy- **Order Bumps:** Upsell inteligente- Hover effects em todos os elementos clicáveis

vercel --prod

```- **Carrinho Abandonado:** Recuperação automática- Scale effects nos cards



**Status:** ✅ Build passing  - **PIX + Cartão:** Múltiplas formas de pagamento

**Última validação:** 21/01/2026

#### **Sistema de Notificações**

---

### 📊 Analytics Avançado- Toast Provider global

## 📚 Documentação

- **Meta CAPI:** Tracking de conversões- Notificações de sucesso/erro

### Principal

- 📖 **REFACTOR-README.md** - Início rápido- **Funil de Vendas:** Visualização completa- Auto-dismiss após 3 segundos

- 📊 **docs/REFACTOR-DASHBOARD-COMPLETO.md** - Guia completo

- ✅ **docs/CHECKLIST-VALIDACAO.md** - Checklist- **Métricas de Produto:** Performance detalhada- Animação slide-in from right

- 🔄 **docs/ANTES-DEPOIS.md** - Comparação

- **Cohort Analysis:** Análise de coortes

### Técnica

- 🔍 **database/DEBUG-QUERIES.sql** - 18 queries úteis## 🔐 Cards do Dashboard

- 💻 **docs/examples/** - Código exemplo

- 📘 **lib/types/analytics.ts** - TypeScript types## 📚 Documentação



---| Card | Status | Ação | Modal |



## 📊 Status do ProjetoA documentação completa está organizada em:|------|--------|------|-------|



✅ E-commerce completo  | **Instalar Gravador** | Disponível | Ver Guia | SetupGuideModal (3 abas) |

✅ Dashboard Analytics refatorado (10x faster)  

✅ CRM funcional  - **[Setup e Configuração](./docs/setup/)** - Guias de instalação| **Copiar Prompt Mestre** | Disponível | Copiar Agora | Toast + Feedback visual |

✅ Integrações (MercadoPago + AppMax)  

✅ Build passing  - **[Funcionalidades](./docs/features/)** - Lista completa de recursos| **Prompt Cardiologia** | Bloqueado | Desbloquear | PremiumUnlockModal |

🔲 Testes E2E  

🔲 PWA  - **[Integrações](./docs/integrations/)** - AppMax, Meta CAPI, Webhooks| **Escudo Jurídico** | Bloqueado | Desbloquear | PremiumUnlockModal |



---- **[Checkout](./docs/checkout/)** - Sistema de pagamento



## 👨‍💻 Autor## 📁 Estrutura Atualizada



**Mattos Consultor**  ## 🔐 Autenticação

GitHub: [@mattosconsultor](https://github.com/mattosconsultor)

```

---

O sistema usa JWT para autenticação com diferentes níveis de acesso:/app

## 📝 License

- **Admin:** Acesso completo ao painel administrativo  /dashboard

MIT License - veja [LICENSE](LICENSE)

- **User:** Acesso ao dashboard e funcionalidades do produto    layout.tsx           # Layout com Sidebar + ToastProvider

---

    page.tsx            # Página principal com lógica completa

**Desenvolvido com ❤️ para profissionais de saúde**

## 🌐 Links Importantes    globals.css         # Estilos globais + animações

**Status:** 🟢 Pronto para Produção  

**Build:** ✅ Passing  /components

**Última atualização:** 21 de Janeiro de 2026

- **Produção:** https://www.gravadormedico.com.br  Sidebar.tsx          # Menu lateral + Área VIP

- **Repositório:** https://github.com/mattosconsultor/gravador-medico  /modals

- **Documentação:** [/docs](./docs/)    SetupGuideModal.tsx      # Modal de guia com 3 abas

    PremiumUnlockModal.tsx   # Modal de produtos premium

## 🛠️ Scripts Disponíveis  /ui

    card.tsx           # Componente Card

```bash    button.tsx         # Botão com variantes

npm run dev          # Desenvolvimento    badge.tsx          # Badges (Premium/Proteção)

npm run build        # Build de produção    dialog.tsx         # Sistema de Dialog

npm start            # Servidor de produção    toast.tsx          # Sistema de notificações

npm run lint         # Linter    tabs.tsx           # Sistema de abas (novo)

``````



## 📄 Licença## 🎯 Prompt Mestre (Conteúdo Copiado)



Propriedade de Mattos Consultor © 2026O botão "Copiar Prompt Mestre" copia o seguinte texto:



---```

Atue como um escriba médico especialista em documentação clínica. 

**Desenvolvido com ❤️ para profissionais da saúde**Sua missão é transformar gravações de consultas médicas em 

prontuários estruturados, seguindo rigorosamente a metodologia 
SOAP (Subjetivo, Objetivo, Avaliação, Plano).

[... estrutura SOAP completa com diretrizes ...]
```

## 🎨 Design System

- **Cores Primárias**: Azul Royal (#2563EB)
- **Fonte**: Inter (Google Fonts)
- **Estilo**: Clean, Minimalista, Trustworthy
- **Fundo**: Slate-50
- **Sombras**: Suaves e elegantes
- **Bordas**: Arredondadas (rounded-lg)

## 🚀 Próximos Passos

- Integração com backend
- Sistema de autenticação (NextAuth)
- Gateway de pagamento (Stripe/Mercado Pago)
- Painel de analytics
- Biblioteca de prompts expandida
- Sistema de versionamento de prompts

---

**Voice Pen Pro** - Tecnologia a serviço da medicina moderna. 🩺✨
