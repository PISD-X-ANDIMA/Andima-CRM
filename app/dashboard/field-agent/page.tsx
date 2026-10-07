'use client'

import { Suspense } from 'react'
import FieldAgentApp from '@/components/field-agent/FieldAgentApp'

export default function FieldAgentPage() {
  return (
    <div className='py-2'>
      <Suspense fallback={<div className='p-6 text-sm text-slate-400'>Loading Field Agent...</div>}>
        <FieldAgentApp />
      </Suspense>
    </div>
  )
}
