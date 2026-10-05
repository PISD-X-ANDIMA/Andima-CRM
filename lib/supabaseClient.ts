import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn(
      'Variabel Supabase tidak ditemukan! Pastikan .env.local sudah dibuat di root folder dan server Next.js sudah di-restart.'
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
