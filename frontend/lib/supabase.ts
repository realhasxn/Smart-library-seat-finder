import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://bsqfixokaqhvbxzhsjui.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_EOW8eQXhU3jQhyRntuhp4w_K2bCmQth";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);