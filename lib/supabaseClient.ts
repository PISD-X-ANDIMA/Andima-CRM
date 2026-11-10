"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

// Keep the module importable so the UI can show a configuration error instead
// of crashing during rendering when deployment variables are missing.
export const supabase = createBrowserClient(
  supabaseUrl || "http://127.0.0.1:54321",
  supabaseKey || "missing-supabase-key",
);
