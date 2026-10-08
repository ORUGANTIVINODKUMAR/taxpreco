ALTER TABLE public.mutual_fund_sessions
  ADD COLUMN owner_user_id UUID REFERENCES public.users(id);
CREATE INDEX mutual_fund_sessions_owner_context_idx
  ON public.mutual_fund_sessions (owner_user_id, client_id, tax_year, created_at DESC);
COMMENT ON COLUMN public.mutual_fund_sessions.owner_user_id IS
  'Verified local owner. NULL legacy rows remain inaccessible until explicitly mapped.';
