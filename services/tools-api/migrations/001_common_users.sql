CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  firebase_uid TEXT NOT NULL UNIQUE
    CHECK (char_length(firebase_uid) BETWEEN 1 AND 128 AND firebase_uid = btrim(firebase_uid)),
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Explicitly provisioned common users for all Upsilon tools. Never auto-create at login.';
COMMENT ON COLUMN public.users.id IS 'Stable local UUID; distinct from Firebase UID and legacy session user_id.';
