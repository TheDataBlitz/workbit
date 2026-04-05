-- Reporting is aggregated in the Node API; remove RPC if a prior migration created it.
drop function if exists public.get_ai_token_usage_report_for_user(uuid, timestamptz, text);
