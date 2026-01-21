-- ==========================================
-- 🧪 DADOS DE TESTE PARA ANALYTICS
-- ==========================================
-- Popula analytics_visits com dados simulados
-- Execute APÓS criar o schema principal

-- 1️⃣ INSERIR VISITANTES DE TESTE (Últimos 30 dias)
INSERT INTO public.analytics_visits (
  session_id,
  page_path,
  last_seen,
  is_online,
  user_agent,
  device_type,
  referrer_domain,
  utm_source,
  utm_medium,
  utm_campaign,
  created_at
) VALUES
  -- Google Ads (10 visitantes)
  ('session_ga_1', '/pricing', NOW() - INTERVAL '1 day', false, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'desktop', 'google.com', 'google', 'cpc', 'lancamento-2026', NOW() - INTERVAL '1 day'),
  ('session_ga_2', '/checkout', NOW() - INTERVAL '2 days', false, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'desktop', 'google.com', 'google', 'cpc', 'lancamento-2026', NOW() - INTERVAL '2 days'),
  ('session_ga_3', '/', NOW() - INTERVAL '3 days', false, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'mobile', 'google.com', 'google', 'cpc', 'lancamento-2026', NOW() - INTERVAL '3 days'),
  ('session_ga_4', '/pricing', NOW() - INTERVAL '4 days', false, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'desktop', 'google.com', 'google', 'cpc', 'black-friday', NOW() - INTERVAL '4 days'),
  ('session_ga_5', '/checkout', NOW() - INTERVAL '5 days', false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'desktop', 'google.com', 'google', 'cpc', 'black-friday', NOW() - INTERVAL '5 days'),
  ('session_ga_6', '/', NOW() - INTERVAL '6 days', false, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'mobile', 'google.com', 'google-organic', 'organic', 'none', NOW() - INTERVAL '6 days'),
  ('session_ga_7', '/pricing', NOW() - INTERVAL '7 days', false, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'desktop', 'google.com', 'google-organic', 'organic', 'none', NOW() - INTERVAL '7 days'),
  ('session_ga_8', '/', NOW() - INTERVAL '8 days', false, 'Mozilla/5.0 (iPad; CPU OS 14_0)', 'tablet', 'google.com', 'google', 'cpc', 'lancamento-2026', NOW() - INTERVAL '8 days'),
  ('session_ga_9', '/checkout', NOW() - INTERVAL '9 days', false, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'desktop', 'google.com', 'google', 'cpc', 'lancamento-2026', NOW() - INTERVAL '9 days'),
  ('session_ga_10', '/pricing', NOW() - INTERVAL '10 days', false, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'mobile', 'google.com', 'google-organic', 'organic', 'none', NOW() - INTERVAL '10 days'),

  -- Instagram (8 visitantes)
  ('session_ig_1', '/pricing', NOW() - INTERVAL '1 day', false, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'mobile', 'instagram.com', 'instagram', 'social', 'story-ads', NOW() - INTERVAL '1 day'),
  ('session_ig_2', '/checkout', NOW() - INTERVAL '2 days', false, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'mobile', 'instagram.com', 'instagram', 'social', 'story-ads', NOW() - INTERVAL '2 days'),
  ('session_ig_3', '/', NOW() - INTERVAL '3 days', false, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'mobile', 'instagram.com', 'social-organic', 'organic', 'none', NOW() - INTERVAL '3 days'),
  ('session_ig_4', '/pricing', NOW() - INTERVAL '4 days', false, 'Mozilla/5.0 (Android)', 'mobile', 'instagram.com', 'instagram', 'social', 'feed-ads', NOW() - INTERVAL '4 days'),
  ('session_ig_5', '/checkout', NOW() - INTERVAL '5 days', false, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'mobile', 'instagram.com', 'instagram', 'social', 'feed-ads', NOW() - INTERVAL '5 days'),
  ('session_ig_6', '/', NOW() - INTERVAL '6 days', false, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'mobile', 'instagram.com', 'social-organic', 'organic', 'none', NOW() - INTERVAL '6 days'),
  ('session_ig_7', '/pricing', NOW() - INTERVAL '7 days', false, 'Mozilla/5.0 (Android)', 'mobile', 'instagram.com', 'instagram', 'social', 'story-ads', NOW() - INTERVAL '7 days'),
  ('session_ig_8', '/', NOW() - INTERVAL '8 days', false, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'mobile', 'instagram.com', 'social-organic', 'organic', 'none', NOW() - INTERVAL '8 days'),

  -- Direct (5 visitantes)
  ('session_direct_1', '/', NOW() - INTERVAL '1 day', false, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'desktop', NULL, 'direct', 'none', 'none', NOW() - INTERVAL '1 day'),
  ('session_direct_2', '/pricing', NOW() - INTERVAL '2 days', false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'desktop', NULL, 'direct', 'none', 'none', NOW() - INTERVAL '2 days'),
  ('session_direct_3', '/', NOW() - INTERVAL '3 days', false, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'mobile', NULL, 'direct', 'none', 'none', NOW() - INTERVAL '3 days'),
  ('session_direct_4', '/checkout', NOW() - INTERVAL '4 days', false, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'desktop', NULL, 'direct', 'none', 'none', NOW() - INTERVAL '4 days'),
  ('session_direct_5', '/pricing', NOW() - INTERVAL '5 days', false, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'desktop', NULL, 'direct', 'none', 'none', NOW() - INTERVAL '5 days'),

  -- Facebook (3 visitantes)
  ('session_fb_1', '/pricing', NOW() - INTERVAL '1 day', false, 'Mozilla/5.0 (Android)', 'mobile', 'facebook.com', 'facebook', 'social', 'feed-ads', NOW() - INTERVAL '1 day'),
  ('session_fb_2', '/', NOW() - INTERVAL '2 days', false, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'mobile', 'facebook.com', 'social-organic', 'organic', 'none', NOW() - INTERVAL '2 days'),
  ('session_fb_3', '/checkout', NOW() - INTERVAL '3 days', false, 'Mozilla/5.0 (Android)', 'mobile', 'facebook.com', 'facebook', 'social', 'feed-ads', NOW() - INTERVAL '3 days'),

  -- Visitantes ONLINE AGORA (5 pessoas)
  ('session_online_1', '/pricing', NOW() - INTERVAL '1 minute', true, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'desktop', 'google.com', 'google', 'cpc', 'lancamento-2026', NOW() - INTERVAL '5 minutes'),
  ('session_online_2', '/checkout', NOW() - INTERVAL '2 minutes', true, 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)', 'mobile', 'instagram.com', 'instagram', 'social', 'story-ads', NOW() - INTERVAL '3 minutes'),
  ('session_online_3', '/', NOW() - INTERVAL '30 seconds', true, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'desktop', NULL, 'direct', 'none', 'none', NOW() - INTERVAL '1 minute'),
  ('session_online_4', '/pricing', NOW() - INTERVAL '1 minute', true, 'Mozilla/5.0 (Android)', 'mobile', 'facebook.com', 'facebook', 'social', 'feed-ads', NOW() - INTERVAL '2 minutes'),
  ('session_online_5', '/checkout', NOW() - INTERVAL '3 minutes', true, 'Mozilla/5.0 (iPad; CPU OS 14_0)', 'tablet', 'google.com', 'google-organic', 'organic', 'none', NOW() - INTERVAL '4 minutes');

-- ✅ DONE! Dados de Teste Inseridos

-- 2️⃣ VERIFICAR DADOS
SELECT 
  utm_source as fonte,
  COUNT(*) as visitantes,
  COUNT(*) FILTER (WHERE page_path LIKE '%checkout%') as checkouts
FROM analytics_visits
GROUP BY utm_source
ORDER BY visitantes DESC;

-- 3️⃣ VERIFICAR VISITANTES ONLINE
SELECT * FROM analytics_visitors_online;

-- 4️⃣ VERIFICAR ATRIBUIÇÃO
SELECT * FROM marketing_attribution ORDER BY total_revenue DESC LIMIT 5;
