'use client';

import { Suspense } from 'react';
import InteractionTab from '@/components/InteractionTab';

export default function RecordConversationPage() {
  return (
    <div className="py-2">
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat Record Conversation...</div>}>
        <InteractionTab />
      </Suspense>
    </div>
  );
}

