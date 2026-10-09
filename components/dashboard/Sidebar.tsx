'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  LayoutDashboard,
  Headphones,
  Users,
  ChevronDown,
  ChevronRight,
  Contact,
  LogOut,
  Settings,
} from 'lucide-react'

interface SubMenuItem {
  name: string
  href: string
}

const salesExecutiveSubMenus: SubMenuItem[] = [
  {
    name: 'Company List',
    href: '/dashboard/company-list',
  },
  {
    name: 'Meeting Schedule',
    href: '/dashboard/meeting-schedule',
  },
  {
    name: 'Record Conversation',
    href: '/dashboard/record-conversation',
  },
  {
    name: 'Task Field Agent',
    href: '/dashboard/task-of-field-agent',
  },
  {
    name: 'Need Back up',
    href: '/dashboard/need-backup',
  },
]

const fieldAgentMenus: SubMenuItem[] = [
  {
    name: 'Overview',
    href: '/dashboard/field-agent?tab=field-agent',
  },
  {
    name: 'My Task',
    href: '/dashboard/field-agent?tab=tasks',
  },
  {
    name: 'Job History',
    href: '/dashboard/field-agent?tab=history',
  },
]

export function Sidebar(): React.ReactElement {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [crmOpen, setCrmOpen] = useState(true)
  const [fieldAgentOpen, setFieldAgentOpen] = useState(false)

  const isFieldAgentActive = pathname.startsWith('/dashboard/field-agent')
  const currentFieldTab = searchParams?.get('tab') || 'field-agent'

  const handleLogout = async (): Promise<void> => {
    await supabase.auth.signOut()
    try {
      localStorage.removeItem('andima_user')
    } catch {}
    router.push('/login')
  }

  return (
    <aside className='sticky top-0 flex h-screen w-[240px] shrink-0 flex-col bg-[#0b1a34] text-slate-300 select-none'>
      {/* Brand Header */}
      <div className='flex h-20 items-center gap-3 px-5 border-b border-white/[0.06]'>
        <Image
          src='/andima-logo.png'
          alt='PT Andima Transportindo'
          width={40}
          height={40}
          className='h-9 w-9 shrink-0 object-contain'
          priority
        />
        <div className='leading-tight'>
          <h1 className='text-[14px] font-extrabold tracking-wider text-white'>ANDIMA</h1>
          <p className='text-[10px] font-bold tracking-wide text-slate-200'>TRANSPORTINDO</p>
          <p className='mt-0.5 text-[5px] tracking-[0.2em] text-blue-400'>ENTERPRISE DIGITAL ECOSYSTEM</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className='flex-1 space-y-1.5 overflow-y-auto px-3.5 pt-5 pb-4'>
        {/* Dashboard */}
        <Link
          href='/dashboard'
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
            pathname === '/dashboard'
              ? 'bg-[#1d63ff] text-white shadow-sm'
              : 'text-white hover:bg-white/[0.06]'
          }`}
        >
          <LayoutDashboard className='h-4 w-4 text-white shrink-0' />
          <span>Dashboard</span>
        </Link>

        {/* CCR */}
        <button
          type='button'
          className='flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.06] cursor-pointer'
        >
          <Headphones className='h-4 w-4 text-white shrink-0' />
          <span>CCR</span>
        </button>

        {/* CRM Section */}
        <div className='pt-1'>
          <div className='flex items-center gap-2'>
            <span className='grid h-8 w-8 place-items-center rounded-lg text-white shrink-0'>
              <Contact className='h-4.5 w-4.5 text-white' />
            </span>
            <button
              type='button'
              onClick={() => setCrmOpen((prev) => !prev)}
              className='flex flex-1 items-center justify-between rounded-xl bg-[#1d63ff] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-600 cursor-pointer'
            >
              <span>CRM</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  crmOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Submenu Tree List */}
          {crmOpen && (
            <div className='mt-2.5 ml-4 space-y-1 border-l border-slate-600/40 pl-3'>
              {/* Sales Executive Parent */}
              <Link
                href='/dashboard/sales-executive'
                className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  pathname === '/dashboard/sales-executive'
                    ? 'bg-[#9cb8cd] text-slate-800 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] font-semibold'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    pathname === '/dashboard/sales-executive' ? 'bg-[#06b6d4]' : 'bg-slate-500'
                  }`}
                />
                <span>Sales Executive</span>
              </Link>

              {/* Indented Sales Executive Submenu Items */}
              <div className='space-y-1 pl-1.5'>
                {salesExecutiveSubMenus.map((sub) => {
                  const isActive =
                    pathname === sub.href || pathname.startsWith(`${sub.href}/`)

                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                        isActive
                          ? 'bg-[#9cb8cd] text-slate-800 font-bold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] font-medium'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          isActive ? 'bg-[#06b6d4]' : 'bg-slate-500'
                        }`}
                      />
                      <span>{sub.name}</span>
                    </Link>
                  )
                })}
              </div>

              {/* Field Agent Item */}
              <div className='pt-1.5'>
                <button
                  type='button'
                  onClick={() => setFieldAgentOpen((prev) => !prev)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    isFieldAgentActive ? 'text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>Field Agent</span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                      fieldAgentOpen ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {fieldAgentOpen && (
                  <div className='mt-1 space-y-1 pl-2 border-l border-slate-600/30'>
                    {fieldAgentMenus.map((item) => {
                      const itemTab = item.href.includes('tab=')
                        ? item.href.split('tab=')[1]
                        : 'field-agent'
                      const isActive =
                        isFieldAgentActive && currentFieldTab === itemTab

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1 text-xs transition-colors ${
                            isActive
                              ? 'bg-[#9cb8cd] text-slate-800 font-bold shadow-xs'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              isActive ? 'bg-[#06b6d4]' : 'bg-slate-500'
                            }`}
                          />
                          <span>{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* HRMS */}
        <div className='pt-1'>
          <button
            type='button'
            className='flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.06] cursor-pointer'
          >
            <Users className='h-4 w-4 text-white shrink-0' />
            <span>HRMS</span>
          </button>
        </div>
      </nav>

      {/* Bottom User / Logout Bar */}
      <div className='p-3.5 border-t border-white/[0.06] space-y-2'>
        <Link
          href='/dashboard/settings'
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold transition-colors ${
            pathname.startsWith('/dashboard/settings')
              ? 'bg-white/[0.12] text-white shadow-2xs'
              : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
          }`}
        >
          <Settings className='h-4 w-4' />
          <span>Pengaturan</span>
        </Link>

        <button
          type='button'
          onClick={() => void handleLogout()}
          className='flex w-full items-center justify-center gap-2 rounded-full border border-red-500/80 bg-transparent py-1.5 px-4 text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all cursor-pointer'
        >
          <LogOut className='h-3.5 w-3.5' />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

