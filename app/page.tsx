'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    });
  }, [router]);

  // Loading state saat redirect
  return (
    <div className="min-h-screen bg-[#07111F] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-[#3B6FF5] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60 text-sm font-medium tracking-wide">Loading...</p>
      </div>
    </div>
  );
}
