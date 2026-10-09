'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { X, Calendar, Clock, ChevronDown, Loader2, AlertCircle } from 'lucide-react'
import type { CreateCustomerInput, CustomerListItem, ApiResponse } from '@/types/customer'
import { isValidPicPhoneNumber } from '@/lib/validation/pic-phone'

interface CustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (companyId: string) => void
  customer?: CustomerListItem | null
}

interface FormErrors {
  company_name?: string
  address?: string
  pic_full_name?: string
  pic_phone_number?: string
  general?: string
}

const INITIAL_FORM: CreateCustomerInput = {
  company_name: '',
  address: '',
  pic_full_name: '',
  pic_phone_number: '',
}

function validate(data: CreateCustomerInput): FormErrors {
  const errors: FormErrors = {}
  if (!data.company_name.trim()) errors.company_name = 'Company name is required'
  if (!data.address.trim()) errors.address = 'Address is required'
  if (!data.pic_full_name.trim()) errors.pic_full_name = 'PIC name is required'
  if (!data.pic_phone_number.trim()) errors.pic_phone_number = 'PIC phone number is required'
  else if (!isValidPicPhoneNumber(data.pic_phone_number)) {
    errors.pic_phone_number = 'Use a number beginning with 0 or +62, followed by digits'
  }
  return errors
}

function formatMeetingDateDisplay(val?: string): string {
  if (!val) return '7 Oct 2026'
  try {
    const [y, m, d] = val.split('-').map(Number)
    if (!y || !m || !d) return val
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return val
  }
}

export function CustomerFormModal({ isOpen, onClose, onSuccess, customer }: CustomerFormModalProps) {
  const [form, setForm] = useState<CreateCustomerInput>(INITIAL_FORM)
  const [meetingDate, setMeetingDate] = useState('2026-10-07')
  const [meetingTime, setMeetingTime] = useState('09:00 - 10:00')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setForm(
      customer
        ? {
            company_name: customer.companyName,
            address: customer.address || '',
            pic_full_name: customer.primaryPic?.fullName || '',
            pic_phone_number: customer.primaryPic?.phoneNumber || '',
          }
        : INITIAL_FORM
    )

    if (customer?.meetings && customer.meetings.length > 0) {
      const firstMeeting = customer.meetings[0]
      setMeetingDate(firstMeeting.meetingDate || firstMeeting.occurrenceDate || '2026-10-07')
      const start = firstMeeting.startTime?.slice(0, 5) || '09:00'
      const end = firstMeeting.endTime?.slice(0, 5) || '10:00'
      setMeetingTime(`${start} - ${end}`)
    } else if (customer?.meetingSchedule) {
      const schedule = customer.meetingSchedule
      setMeetingDate(schedule.meetingDate || schedule.occurrenceDate || '2026-10-07')
      const start = schedule.startTime?.slice(0, 5) || '09:00'
      const end = schedule.endTime?.slice(0, 5) || '10:00'
      setMeetingTime(`${start} - ${end}`)
    } else {
      setMeetingDate('2026-10-07')
      setMeetingTime('09:00 - 10:00')
    }

    setErrors({})
  }, [customer, isOpen])

  const handleChange = useCallback((field: keyof CreateCustomerInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }))
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const validationErrors = validate(form)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }

      setIsSubmitting(true)
      setErrors({})

      try {
        const res = await fetch(
          customer ? `/api/v1/customers/${customer.id}` : '/api/v1/customers/create',
          {
            method: customer ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
          }
        )

        const json: ApiResponse<{ companyId?: string }> = await res.json()

        if (!json.success) {
          if (json.code === 'DUPLICATE_001' || json.code === 'CUSTOMER_003') {
            setErrors({ company_name: json.message || 'This company is already registered' })
          } else if (json.code === 'CUSTOMER_002') {
            setErrors({ pic_phone_number: json.message || 'Enter a valid PIC phone number' })
          } else {
            setErrors({ general: json.message || 'Failed to save the customer' })
          }
          return
        }

        const targetId = customer?.id || json.data.companyId
        if (targetId && meetingDate) {
          try {
            const [startTime, endTime] = meetingTime.split(' - ')
            const dateObj = new Date(meetingDate)
            const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
            const meeting_day = days[dateObj.getDay()] || 'wednesday'
            await fetch(`/api/v1/customers/${targetId}/meetings`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                meeting_day,
                schedule_type: 'one_day',
                meeting_date: meetingDate,
                start_time: (startTime || '09:00') + ':00',
                end_time: (endTime || '10:00') + ':00',
                agenda: 'Initial Meeting',
                pic_name: form.pic_full_name,
                representative_name: 'Sales Executive',
                meeting_type: 'offline',
                location: form.address,
              }),
            })
          } catch {
            // Keep customer save successful even if meeting save encountered an issue
          }
        }

        setForm(INITIAL_FORM)
        onSuccess(targetId || '')
      } catch {
        setErrors({ general: 'A connection error occurred. Please try again.' })
      } finally {
        setIsSubmitting(false)
      }
    },
    [form, onSuccess, customer, meetingDate, meetingTime]
  )

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setForm(INITIAL_FORM)
      setErrors({})
      onClose()
    }
  }, [isSubmitting, onClose])

  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-[1px] animate-in fade-in duration-150'
      aria-modal='true'
      role='dialog'
      aria-labelledby='customer-modal-title'
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className='relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <h2
            id='customer-modal-title'
            className='text-2xl font-bold tracking-tight text-slate-900 dark:text-white'
          >
            {customer ? 'Edit Company' : 'Add Company'}
          </h2>
          <button
            type='button'
            onClick={handleClose}
            disabled={isSubmitting}
            className='rounded-lg p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer'
            aria-label='Close dialog'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          {errors.general && (
            <div className='mb-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-medium text-rose-700 dark:text-rose-300'>
              <AlertCircle className='w-4 h-4 shrink-0 mt-0.5' />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Company Name */}
          <div className='mb-4'>
            <label
              htmlFor='field-company_name'
              className='block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5'
            >
              Company Name <span className='text-rose-500'>*</span>
            </label>
            <input
              id='field-company_name'
              type='text'
              value={form.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              placeholder='PT DSV Transport Indonesia'
              className={`w-full h-11 px-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 ${
                errors.company_name
                  ? 'border-rose-300 dark:border-rose-800'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.company_name && (
              <p className='mt-1 text-xs text-rose-500'>{errors.company_name}</p>
            )}
          </div>

          {/* Address */}
          <div className='mb-4'>
            <label
              htmlFor='field-address'
              className='block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5'
            >
              Address <span className='text-rose-500'>*</span>
            </label>
            <input
              id='field-address'
              type='text'
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder='Jl. Raya Cakung Cilincing No. 18, Jakarta Utara'
              className={`w-full h-11 px-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 ${
                errors.address
                  ? 'border-rose-300 dark:border-rose-800'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.address && (
              <p className='mt-1 text-xs text-rose-500'>{errors.address}</p>
            )}
          </div>

          {/* PIC Name & PIC Number (2 Columns) */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
            <div>
              <label
                htmlFor='field-pic_full_name'
                className='block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5'
              >
                PIC Name <span className='text-rose-500'>*</span>
              </label>
              <input
                id='field-pic_full_name'
                type='text'
                value={form.pic_full_name}
                onChange={(e) => handleChange('pic_full_name', e.target.value)}
                placeholder='Aida'
                className={`w-full h-11 px-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 ${
                  errors.pic_full_name
                    ? 'border-rose-300 dark:border-rose-800'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.pic_full_name && (
                <p className='mt-1 text-xs text-rose-500'>{errors.pic_full_name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor='field-pic_phone_number'
                className='block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5'
              >
                PIC Number <span className='text-rose-500'>*</span>
              </label>
              <input
                id='field-pic_phone_number'
                type='tel'
                value={form.pic_phone_number}
                onChange={(e) => handleChange('pic_phone_number', e.target.value)}
                placeholder='081231903090'
                className={`w-full h-11 px-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 ${
                  errors.pic_phone_number
                    ? 'border-rose-300 dark:border-rose-800'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.pic_phone_number && (
                <p className='mt-1 text-xs text-rose-500'>{errors.pic_phone_number}</p>
              )}
            </div>
          </div>

          {/* Initial Meeting Schedule */}
          <div className='mb-7'>
            <label className='block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5'>
              Initial Meeting Schedule
            </label>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* Date Selector */}
              <div className='relative flex items-center justify-between h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer'>
                <div className='flex items-center gap-2.5 flex-1 min-w-0 pointer-events-none'>
                  <Calendar className='w-4 h-4 text-slate-400 shrink-0' />
                  <span className='text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 truncate'>
                    {formatMeetingDateDisplay(meetingDate)}
                  </span>
                </div>
                <ChevronDown className='w-4 h-4 text-slate-400 shrink-0 pointer-events-none' />
                <input
                  type='date'
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className='absolute inset-0 opacity-0 cursor-pointer w-full h-full'
                />
              </div>

              {/* Time Range Selector */}
              <div className='relative flex items-center justify-between h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'>
                <Clock className='w-4 h-4 text-slate-400 shrink-0 mr-2.5 pointer-events-none' />
                <select
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className='w-full h-full bg-transparent text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 outline-none appearance-none cursor-pointer pr-6'
                >
                  <option value='08:00 - 09:00' className='dark:bg-slate-800'>08:00 - 09:00</option>
                  <option value='09:00 - 10:00' className='dark:bg-slate-800'>09:00 - 10:00</option>
                  <option value='10:00 - 11:00' className='dark:bg-slate-800'>10:00 - 11:00</option>
                  <option value='11:00 - 12:00' className='dark:bg-slate-800'>11:00 - 12:00</option>
                  <option value='13:00 - 14:00' className='dark:bg-slate-800'>13:00 - 14:00</option>
                  <option value='14:00 - 15:00' className='dark:bg-slate-800'>14:00 - 15:00</option>
                  <option value='15:00 - 16:00' className='dark:bg-slate-800'>15:00 - 16:00</option>
                  <option value='16:00 - 17:00' className='dark:bg-slate-800'>16:00 - 17:00</option>
                </select>
                <ChevronDown className='w-4 h-4 text-slate-400 shrink-0 absolute right-3.5 pointer-events-none' />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className='flex items-center justify-end gap-3 pt-1'>
            <button
              type='button'
              onClick={handleClose}
              disabled={isSubmitting}
              className='h-11 px-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='inline-flex items-center justify-center h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-xs sm:text-sm font-semibold text-white transition-colors shadow-xs disabled:opacity-60 cursor-pointer'
            >
              {isSubmitting ? (
                <span className='inline-flex items-center gap-2'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  <span>Saving...</span>
                </span>
              ) : (
                <span>{customer ? 'Save Changes' : 'Add Company'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
