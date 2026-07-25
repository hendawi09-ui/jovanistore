import { createClient } from "@supabase/supabase-js";

// Server-only client. Never import this in a "use client" component —
// it uses the service role key which must stay secret.
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
