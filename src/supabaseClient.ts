import { createClient } from "@supabase/supabase-js";

// Retrieve Supabase environment variables from Vite configuration
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Awas: VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemui dalam environment. Sila pastikan fail .env diletakkan dengan betul."
  );
}

// Initialize the client for use in the frontend components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

