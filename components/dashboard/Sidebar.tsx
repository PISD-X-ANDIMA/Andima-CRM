'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
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
  X,
} from 'lucide-react'

interface SubMenuItem {
  name: string
  href: string
  badgeType?: 'default' | 'success' | 'danger'
  key?: 'myTasks' | 'fieldReports' | 'needBackup'
}


const fieldAgentMenus: SubMenuItem[] = [
  {
    name: 'Overview',
    href: '/dashboard/field-agent?tab=field-agent',
  },
  {
    name: 'My Tasks',
    href: '/dashboard/field-agent?tab=tasks',
    badgeType: 'default',
    key: 'myTasks',
  },
  {
    name: 'Field Reports',
    href: '/dashboard/field-agent?tab=history',
    badgeType: 'success',
    key: 'fieldReports',
  },
  {
    name: 'Need Backup',
    href: '/dashboard/need-backup',
    badgeType: 'danger',
    key: 'needBackup',
  },
]

export function Sidebar(): React.ReactElement {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [crmOpen, setCrmOpen] = useState(true)
  const [fieldAgentOpen, setFieldAgentOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Dynamic badge counts for Field Agent menus
  const [counts, setCounts] = useState<{
    myTasks: number
    fieldReports: number
    needBackup: number
  }>({
    myTasks: 5,
    fieldReports: 3,
    needBackup: 2,
  })

  const isFieldAgentActive =
    pathname.startsWith('/dashboard/field-agent') ||
    pathname.startsWith('/dashboard/need-backup') ||
    pathname === '/dashboard'
  const currentFieldTab =
    pathname === '/dashboard' ? 'field-agent' : (searchParams?.get('tab') || 'field-agent')

  useEffect(() => {
    const fetchCounts = async (): Promise<void> => {
      try {
        // 1. Fetch from A3-tasks API (same endpoint used by Field Agent App)
        let myTasksTotal = 0
        let completedTotal = 0

        try {
          const a3Res = await fetch('/api/feature/A3-tasks', { cache: 'no-store' })
          if (a3Res.ok) {
            const a3Data = await a3Res.json()
            if (a3Data.success && Array.isArray(a3Data.data)) {
              myTasksTotal = a3Data.data.length
              completedTotal = a3Data.data.filter((t: any) => {
                const s = String(t.status || '').trim().toUpperCase()
                return s === 'COMPLETED' || s === 'SELESAI'
              }).length
            }
          }
        } catch {}

        // 2. Fetch need backup tickets count (open/pending tickets)
        let backupTotal = 3
        try {
          const raw = typeof window !== 'undefined' ? localStorage.getItem('andima_need_backup_tickets') : null
          if (raw) {
            const parsed = JSON.parse(raw)
            const activeTickets = parsed.filter((t: any) => t.status !== 'Resolved' && t.status !== 'Completed').length
            backupTotal = activeTickets
          } else {
            const { count: bckCount, error: bckErr } = await supabase
              .from('a2_need_backups')
              .select('*', { count: 'exact', head: true })
              .in('status', ['Pending', 'Open', 'Inprogress', 'pending', 'open', 'To do', 'In progres', 'In riview', 'to do', 'in progres', 'in riview'])

            if (!bckErr && typeof bckCount === 'number' && bckCount > 0) {
              backupTotal = bckCount
            }
          }
        } catch {}

        setCounts({
          myTasks: myTasksTotal,
          fieldReports: completedTotal,
          needBackup: backupTotal,
        })
      } catch (err) {
        console.error('Error fetching sidebar badge counts:', err)
      }
    }

    void fetchCounts()

    // Listen to custom event when new conversation with need assistance or new task is added
    const handleRefresh = (): void => {
      void fetchCounts()
    }
    window.addEventListener('need-backup-updated', handleRefresh)
    window.addEventListener('need_backup_updated', handleRefresh)
    window.addEventListener('storage', handleRefresh)

    return () => {
      window.removeEventListener('need-backup-updated', handleRefresh)
      window.removeEventListener('need_backup_updated', handleRefresh)
      window.removeEventListener('storage', handleRefresh)
    }
  }, [pathname, searchParams])

  useEffect(() => {
    const handleToggle = (): void => setMobileOpen((prev) => !prev)
    const handleClose = (): void => setMobileOpen(false)
    window.addEventListener('toggle-mobile-sidebar', handleToggle)
    window.addEventListener('close-mobile-sidebar', handleClose)
    return () => {
      window.removeEventListener('toggle-mobile-sidebar', handleToggle)
      window.removeEventListener('close-mobile-sidebar', handleClose)
    }
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname, searchParams])

  const handleLogout = async (): Promise<void> => {
    await supabase.auth.signOut()
    try {
      localStorage.removeItem('andima_user')
    } catch {}
    router.push('/login')
  }

  const renderNavContent = (isMobile = false): React.ReactElement => (
    <>
      {/* Brand Header */}
      <div className='flex h-20 items-center justify-between px-5 border-b border-white/[0.06]'>
        <div className='flex items-center gap-3'>
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
        {isMobile && (
          <button
            type='button'
            onClick={() => setMobileOpen(false)}
            className='grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer'
            aria-label='Tutup Menu'
          >
            <X className='h-5 w-5' />
          </button>
        )}
      </div>

      {/* Main Nav */}
      <nav className='flex-1 space-y-1.5 overflow-y-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-3.5 pt-5 pb-4'>
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
              {/* Field Agent Item */}
              <div>
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
                      const badgeVal = item.key ? counts[item.key] : undefined
                      const isNeedBackupRoute = item.href === '/dashboard/need-backup'
                      const isActive = isNeedBackupRoute
                        ? pathname === '/dashboard/need-backup'
                        : (pathname.startsWith('/dashboard/field-agent') || pathname === '/dashboard') && currentFieldTab === itemTab

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                            isActive
                              ? 'bg-[#9cb8cd] text-slate-800 font-bold shadow-xs'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className='flex items-center gap-2 min-w-0'>
                            <span
                              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                isActive ? 'bg-[#06b6d4]' : 'bg-slate-500'
                              }`}
                            />
                            <span className='truncate'>{item.name}</span>
                          </div>

                          {badgeVal !== undefined && (
                            <span
                              className={`shrink-0 text-[11px] font-bold ${
                                item.badgeType === 'success'
                                  ? 'text-emerald-400 font-extrabold pr-0.5'
                                  : item.badgeType === 'danger'
                                  ? 'text-rose-400 font-extrabold pr-0.5'
                                  : 'px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px]'
                              }`}
                            >
                              {badgeVal}
                            </span>
                          )}
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
    </>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className='hidden lg:flex sticky top-0 h-screen w-[240px] shrink-0 flex-col bg-[#0b1a34] text-slate-300 select-none'>
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer (Slide-in) */}
      {mobileOpen && (
        <div className='fixed inset-0 z-[999] lg:hidden'>
          {/* Backdrop */}
          <div
            className='fixed inset-0 z-[998] bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200'
            onClick={() => setMobileOpen(false)}
          />
          {/* Sliding Panel */}
          <aside className='fixed inset-y-0 left-0 z-[999] flex h-full w-[280px] max-w-[85vw] flex-col bg-[#0b1a34] text-slate-300 shadow-2xl animate-in slide-in-from-left duration-200 select-none'>
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  )
}

