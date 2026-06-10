-- Grant permissions to Supabase anonymous role
-- Run this in Supabase SQL Editor

-- Grant permissions on all tables to anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions on all sequences (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant permissions on specific tables (if above doesn't work)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refresh_tokens TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON public.users_id_seq TO anon;
GRANT USAGE, SELECT ON public.products_id_seq TO anon;
GRANT USAGE, SELECT ON public.sales_id_seq TO anon;
GRANT USAGE, SELECT ON public.sale_products_id_seq TO anon;
GRANT USAGE, SELECT ON public.settings_id_seq TO anon;
GRANT USAGE, SELECT ON public.refresh_tokens_id_seq TO anon;
GRANT USAGE, SELECT ON public.audit_logs_id_seq TO anon;
