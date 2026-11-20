import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bsqfixokaqhvbxzhsjui.supabase.co";
const supabaseAnonKey = "sb_publishable_EOW8eQXhU3jQhyRntuhp4w_K2bCmQth";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);