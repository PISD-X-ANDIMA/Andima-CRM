'use client'

import { useEffect, useState } from 'react'
import { MapPin, Video, X } from 'lucide-react'
import type { ActiveMeeting, ApiResponse, CustomerDetailItem, CustomerListItem, CustomerMeetingItem } from '@/types/customer'

type ModalMode = 'details' | 'tasks'

interface Props {
  customer: CustomerListItem | null
  mode: ModalMode | null
  onClose: () => void
  onEdit?: (customer: CustomerListItem) => void
  onDelete?: (customer: CustomerListItem) => void
}

function formatMeetingDateTime(meeting?: CustomerMeetingItem | ActiveMeeting | null): string {
  if (!meeting) return '7 Oct 2026, 09:00 – 10:00'
  const dateStr = meeting.meetingDate || meeting.effectiveStartDate || ('occurrenceDate' in meeting ? meeting.occurrenceDate : null)
  const start = meeting.startTime?.slice(0, 5) || '09:00'
  const end = meeting.endTime?.slice(0, 5) || '10:00'
  if (dateStr) {
    try {
      const [y, m, d] = dateStr.split('-').map(Number)
      if (y && m && d) {
        const dt = new Date(y, m - 1, d)
        const month = dt.toLocaleDateString('en-GB', { month: 'short' })
        return `${d} ${month} ${y}, ${start} – ${end}`
      }
    } catch {}
  }
  return meeting.formattedSchedule ? `${meeting.formattedSchedule}, ${start} – ${end}` : '7 Oct 2026, 09:00 – 10:00'
}

export function CompanyActionModal({ customer, mode, onClose, onEdit, onDelete }: Props) {
  const [detail, setDetail] = useState<CustomerDetailItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!customer || !mode || mode === 'tasks') {
      setDetail(null)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setDetail(null)
    setError('')
    setLoading(true)
    fetch(`/api/v1/customers/${customer.id}`, { signal: controller.signal })
      .then(async (response) => {
        const result: ApiResponse<CustomerDetailItem> = await response.json()
        if (!response.ok || !result.success) throw new Error(result.success ? 'Failed to load company details.' : result.message)
        setDetail(result.data)
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Failed to load company details.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [customer, mode])

  if (!customer || !mode) return null

  const meeting = detail?.meetings?.[0] || customer.meetings?.[0] || customer.meetingSchedule
  const companyName = detail?.companyName || customer.companyName
  const picName = detail?.primaryPic?.fullName || customer.primaryPic?.fullName || 'Aida'
  const picPhone = detail?.primaryPic?.phoneNumber || customer.primaryPic?.phoneNumber || '081231903090'
  const representative = meeting?.representativeName || 'Yuliana – Sales Executive'
  const location = meeting?.location || detail?.address || customer.address || 'Kantor PT DSV, Jakarta'
  const agenda = meeting?.agenda || 'Diskusi Renewal Kontrak'
  const notes = meeting?.notes || 'Membahaspenyesuaian tarif untuk periode Q4 2026.'
  const isOnline = meeting?.meetingType === 'online'

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role='dialog'
        aria-modal='true'
        aria-labelledby='meeting-details-title'
        className='my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-100 dark:border-slate-800 p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150'
      >
        {/* Header */}
        <header className='flex items-center justify-between mb-6'>
          <h2 id='meeting-details-title' className='text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight'>
            {mode === 'tasks' ? 'Task Of Field Agent' : 'Meeting Details'}
          </h2>
          <button
            type='button'
            aria-label='Close dialog'
            onClick={onClose}
            className='rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer'
          >
            <X className='h-5 w-5' />
          </button>
        </header>

        {/* Content */}
        {mode === 'tasks' ? (
          <div className='rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/30 p-4'>
            <p className='text-xs font-semibold text-slate-800 dark:text-slate-100'>{customer.companyName}</p>
            <p className='mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300'>
              Field Agent tasks are managed by Squad A2. This view is read-only and will display their task data once Squad A2 provides the integration endpoint.
            </p>
          </div>
        ) : loading ? (
          <div role='status' className='grid min-h-48 place-items-center text-xs text-slate-400 dark:text-slate-500'>
            Loading meeting details...
          </div>
        ) : error ? (
          <div role='alert' className='rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-700 dark:text-red-300'>
            {error}
          </div>
        ) : (
          <div className='space-y-4 text-xs sm:text-sm'>
            {/* Company */}
            <div className='flex items-start'>
              <span className='w-40 sm:w-48 shrink-0 font-medium text-slate-400 dark:text-slate-400'>Company</span>
              <span className='font-bold text-slate-900 dark:text-white'>{companyName}</span>
            </div>

            {/* Date & Time */}
            <div className='flex items-start'>
              <span className='w-40 sm:w-48 shrink-0 font-medium text-slate-400 dark:text-slate-400'>Date & Time</span>
              <span className='font-bold text-slate-900 dark:text-white'>{formatMeetingDateTime(meeting)}</span>
            </div>

            {/* Agenda / Topic */}
            <div className='flex items-start'>
              <span className='w-40 sm:w-48 shrink-0 font-medium text-slate-400 dark:text-slate-400'>Agenda / Topic</span>
              <span className='font-bold text-slate-900 dark:text-white'>{agenda}</span>
            </div>

            {/* PIC */}
            <div className='flex items-start'>
              <span className='w-40 sm:w-48 shrink-0 font-medium text-slate-400 dark:text-slate-400'>PIC</span>
              <span className='font-bold text-slate-900 dark:text-white'>{picName} ({picPhone})</span>
            </div>

            {/* Andima Representative */}
            <div className='flex items-start'>
              <span className='w-40 sm:w-48 shrink-0 font-medium text-slate-400 dark:text-slate-400'>Andima Representative</span>
              <span className='font-bold text-slate-900 dark:text-white'>{representative}</span>
            </div>

            {/* Meeting Type */}
            <div className='flex items-start'>
              <span className='w-40 sm:w-48 shrink-0 font-medium text-slate-400 dark:text-slate-400'>Meeting Type</span>
              <div>
                <span className='inline-flex items-center gap-1.5 rounded-lg bg-blue-50/90 dark:bg-blue-950/60 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60'>
                  {isOnline ? (
                    <Video className='h-3.5 w-3.5 text-blue-600 dark:text-blue-400' />
                  ) : (
                    <MapPin className='h-3.5 w-3.5 fill-blue-600 dark:fill-blue-400 text-blue-600 dark:text-blue-400' />
                  )}
                  <span>{isOnline ? 'Online (Meeting Link)' : 'Offline (Location)'}</span>
                </span>
              </div>
            </div>

            {/* Location */}
            <div className='flex items-start'>
              <span className='w-40 sm:w-48 shrink-0 font-medium text-slate-400 dark:text-slate-400'>Location</span>
              <span className='font-bold text-slate-900 dark:text-white'>{location}</span>
            </div>

            {/* Notes */}
            <div className='flex items-start'>
              <span className='w-40 sm:w-48 shrink-0 font-medium text-slate-400 dark:text-slate-400'>Notes</span>
              <span className='text-slate-600 dark:text-slate-300 font-normal leading-relaxed'>{notes}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className='mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3'>
          <button
            type='button'
            onClick={() => {
              onClose()
              onEdit?.(customer)
            }}
            className='rounded-xl border border-blue-400 dark:border-blue-500 bg-white dark:bg-slate-900 px-5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 shadow-2xs transition-colors cursor-pointer'
          >
            Edit Meeting
          </button>
          <button
            type='button'
            onClick={() => {
              onClose()
              onDelete?.(customer)
            }}
            className='rounded-xl border border-rose-300 dark:border-rose-900/60 bg-white dark:bg-slate-900 px-5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-2xs transition-colors cursor-pointer'
          >
            Delete Meeting
          </button>
        </footer>
      </section>
    </div>
  )
}

