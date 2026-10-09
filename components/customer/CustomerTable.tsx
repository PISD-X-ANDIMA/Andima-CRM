'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import type { CustomerListItem } from '@/types/customer'

interface Props {
  customers: CustomerListItem[]
  isLoading: boolean
  error: string | null
  onRetry: () => void
  searchKeyword: string
  onResetSearch: () => void
  onEdit: (customer: CustomerListItem) => void
  onDetails: (customer: CustomerListItem) => void
  onViewTasks: (customer: CustomerListItem) => void
  onDelete: (customer: CustomerListItem) => void
}

function ScheduleItem({ customer }: { customer: CustomerListItem }) {
  const meeting = customer.meetingSchedule || customer.meetings?.[0]
  if (!meeting && !customer.meetings?.length) {
    return <span className='text-xs text-slate-400 dark:text-slate-500'>Unscheduled</span>
  }

  const dateStr = meeting?.meetingDate || meeting?.occurrenceDate
  let line1 = 'Mon,07 Oct'
  let line2 = '2026.09:00–10:00'

  if (dateStr) {
    try {
      const [y, m, d] = dateStr.split('-').map(Number)
      if (y && m && d) {
        const dt = new Date(y, m - 1, d)
        const weekday = dt.toLocaleDateString('en-GB', { weekday: 'short' })
        const dayNum = String(d).padStart(2, '0')
        const monthName = dt.toLocaleDateString('en-GB', { month: 'short' })
        line1 = `${weekday},${dayNum} ${monthName}`
        const start = meeting?.startTime?.slice(0, 5) || '09:00'
        const end = meeting?.endTime?.slice(0, 5) || '10:00'
        line2 = `${y}.${start}–${end}`
      }
    } catch {
      // fallback
    }
  } else if (meeting?.formattedSchedule) {
    const day = meeting.meetingDay
      ? meeting.meetingDay.slice(0, 3).charAt(0).toUpperCase() + meeting.meetingDay.slice(1, 3)
      : 'Wed'
    line1 = `${day},09 Oct`
    const start = meeting.startTime?.slice(0, 5) || '09:00'
    const end = meeting.endTime?.slice(0, 5) || '10:00'
    line2 = `2026.${start}–${end}`
  }

  return (
    <div className='flex items-start gap-2 text-xs'>
      <span className='h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1' />
      <div className='leading-tight font-medium text-slate-800 dark:text-slate-200'>
        <p>{line1}</p>
        <p className='text-[11px] text-slate-500 dark:text-slate-400 mt-0.5'>{line2}</p>
      </div>
    </div>
  )
}

export function CustomerTable({
  customers,
  isLoading,
  error,
  onRetry,
  searchKeyword,
  onResetSearch,
  onEdit,
  onDetails,
  onViewTasks,
}: Props) {
  if (error) {
    return (
      <div
        role='alert'
        className='rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-6 text-center'
      >
        <AlertCircle className='mx-auto h-5 w-5 text-red-600 dark:text-red-400' />
        <p className='mt-2 text-xs font-semibold text-red-800 dark:text-red-300'>
          Failed to load company data
        </p>
        <p className='mt-1 text-xs text-red-700 dark:text-red-400'>{error}</p>
        <button
          onClick={onRetry}
          className='mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer'
        >
          <RefreshCw className='h-3.5 w-3.5' />
          Try again
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div
        aria-label='Loading company list'
        className='overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900'
      >
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className='h-14 animate-pulse border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60'
          />
        ))}
      </div>
    )
  }

  if (!customers.length) {
    return (
      <div className='rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center'>
        <p className='text-xs font-medium text-slate-600 dark:text-slate-400'>
          {searchKeyword ? `No companies found for “${searchKeyword}”` : 'No company data yet.'}
        </p>
        {searchKeyword && (
          <button
            onClick={onResetSearch}
            className='mt-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer'
          >
            Clear search
          </button>
        )}
      </div>
    )
  }

  return (
    <div className='overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs'>
      <table className='w-full min-w-[1020px] table-fixed text-left text-xs'>
        <thead className='bg-[#edf4fb] dark:bg-slate-800/90 border-b border-slate-200/70 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold'>
          <tr>
            <th className='w-[19%] px-5 py-3.5'>Company</th>
            <th className='w-[24%] px-5 py-3.5'>Address</th>
            <th className='w-[11%] px-5 py-3.5'>PIC</th>
            <th className='w-[13%] px-5 py-3.5'>PIC Number</th>
            <th className='w-[17%] px-5 py-3.5'>Meeting Schedule</th>
            <th className='w-[8%] px-4 py-3.5 text-center'>Task</th>
            <th className='w-[8%] px-4 py-3.5 text-center'>Detail</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className='text-slate-700 dark:text-slate-300 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors'
            >
              <td className='break-words px-5 py-4 font-semibold text-slate-900 dark:text-white leading-snug'>
                <button
                  type='button'
                  onClick={() => onEdit(customer)}
                  className='text-left font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer'
                >
                  {customer.companyName}
                </button>
              </td>
              <td className='px-5 py-4 leading-relaxed'>
                <span className='line-clamp-2 text-slate-600 dark:text-slate-400'>
                  {customer.address || '—'}
                </span>
              </td>
              <td className='break-words px-5 py-4 font-medium text-slate-800 dark:text-slate-200'>
                {customer.primaryPic?.fullName || '—'}
              </td>
              <td className='break-words px-5 py-4 font-medium text-slate-800 dark:text-slate-200'>
                {customer.primaryPic?.phoneNumber || '—'}
              </td>
              <td className='px-5 py-4'>
                <ScheduleItem customer={customer} />
              </td>
              <td className='px-4 py-4 text-center'>
                <button
                  type='button'
                  onClick={() => onViewTasks(customer)}
                  className='font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                >
                  View Task
                </button>
              </td>
              <td className='px-4 py-4 text-center'>
                <button
                  type='button'
                  onClick={() => onDetails(customer)}
                  className='font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                >
                  See more..
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
