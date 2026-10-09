"use client"

import { useEffect, useMemo, useState, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import {
  Search,
  Bell,
  HelpCircle,
  Briefcase,
  MessageSquare,
  Building2,
  Loader2,
  ArrowRight,
  X,
  Calendar,
  Check,
  CheckCheck,
  LogOut,
  User,
  Sparkles,
  BellRing
} from 'lucide-react'

const routeLabels: Record<string, string> = {
  'sales-executive': 'Sales Eksekutif',
  'company-list': 'Company List',
  'meeting-schedule': 'Meeting Schedule',
  'record-conversation': 'Record Conversation',
  'task-of-field-agent': 'Task Field Agent',
  'need-backup': 'Need Backup',
  'field-agent': 'Field Agent',
  jobs: 'Jobs',
}

interface SearchResults {
  jobs: Array<{ id: string; job_number: string; task_title?: string; customer?: string; status?: string }>
  conversations: Array<{ id: string; conversation_id: string; job_number?: string; summary?: string; sales_pic_name?: string }>
  customers: Array<{ id: string; customer_name: string; customer_code?: string; city?: string }>
}

interface NotificationItem {
  id: string
  title: string
  desc: string
  time: string
  read: boolean
  link: string
  type: 'meeting' | 'task' | 'customer'
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'New Meeting Scheduled',
    desc: 'Meeting with PT. Indah Jaya scheduled for tomorrow at 10:00 AM',
    time: '10m ago',
    read: false,
    link: '/dashboard/meeting-schedule',
    type: 'meeting',
  },
  {
    id: '2',
    title: 'Field Agent Task Updated',
    desc: 'Job #AENAT/2606/0217 progress updated to In Progress',
    time: '1h ago',
    read: false,
    link: '/dashboard/field-agent?tab=tasks',
    type: 'task',
  },
  {
    id: '3',
    title: 'Customer Added',
    desc: 'PT. Citra Mandiri Cargo was registered into the system',
    time: '3h ago',
    read: false,
    link: '/dashboard/company-list',
    type: 'customer',
  },
]

export function DashboardHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('choirul')

  // Search States
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [isOpenResults, setIsOpenResults] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Notification States
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [isOpenNotifications, setIsOpenNotifications] = useState(false)
  const [activeNotifTab, setActiveNotifTab] = useState<'all' | 'unread'>('all')
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Help Modal States
  const [isOpenHelp, setIsOpenHelp] = useState(false)
  const helpRef = useRef<HTMLDivElement>(null)

  // Profile Menu States
  const [isOpenProfile, setIsOpenProfile] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  const displayedNotifications = useMemo(() => {
    if (activeNotifTab === 'unread') {
      return notifications.filter((n) => !n.read)
    }
    return notifications
  }, [notifications, activeNotifTab])

  // Close menus on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsOpenResults(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsOpenNotifications(false)
      }
      if (helpRef.current && !helpRef.current.contains(target)) {
        setIsOpenHelp(false)
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsOpenProfile(false)
      }
    }

    function handleKeyDownGlobal(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpenResults(false)
        setIsOpenNotifications(false)
        setIsOpenHelp(false)
        setIsOpenProfile(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDownGlobal)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDownGlobal)
    }
  }, [])

  // Debounced search fetch
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults(null)
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/global-search?q=${encodeURIComponent(searchQuery.trim())}`)
        const data = await res.json()
        if (data.success) {
          setSearchResults(data.results)
          setIsOpenResults(true)
        }
      } catch (err) {
        console.error('Failed to run global search:', err)
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load user info
  useEffect(() => {
    let active = true
    const loadUsername = async () => {
      try {
        const savedUser = JSON.parse(localStorage.getItem('andima_user') || 'null') as { name?: string } | null
        if (savedUser?.name?.trim()) {
          if (active) setUsername(savedUser.name.trim())
          return
        }
      } catch {}

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const accountName = session?.user.user_metadata?.full_name || session?.user.email?.split('@')[0] || 'choirul'
        if (active) setUsername(accountName)
      } catch {
        if (active) setUsername('choirul')
      }
    }
    void loadUsername()
    return () => { active = false }
  }, [])

  const currentLabel = useMemo(() => {
    if (pathname?.startsWith('/dashboard/field-agent') && !pathname.includes('task-of-field-agent')) {
      const tab = searchParams?.get('tab')
      if (tab === 'history') return 'Field Agent / Job History'
      if (tab === 'tasks') return 'Field Agent / My Task'
      return 'Field Agent / Overview'
    }
    const segments = pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1]
    return routeLabels[last] || (last ? last.replace(/-/g, ' ') : 'Dashboard')
  }, [pathname, searchParams])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsOpenResults(false)
      const q = encodeURIComponent(searchQuery.trim())
      if (pathname.includes('company-list')) {
        router.push(`/dashboard/company-list?search=${q}`)
      } else if (pathname.includes('field-agent')) {
        router.push(`/dashboard/field-agent?tab=tasks&search=${q}`)
      } else if (pathname.includes('meeting-schedule')) {
        router.push(`/dashboard/meeting-schedule?search=${q}`)
      } else {
        router.push(`/dashboard/company-list?search=${q}`)
      }
    }
  }

  const handleSelectJob = (jobNumber: string) => {
    setIsOpenResults(false)
    router.push(`/dashboard/field-agent?tab=tasks&search=${encodeURIComponent(jobNumber)}`)
  }

  const handleSelectCustomer = (customerName: string) => {
    setIsOpenResults(false)
    router.push(`/dashboard/company-list?search=${encodeURIComponent(customerName)}`)
  }

  const handleSelectConversation = (convId: string) => {
    setIsOpenResults(false)
    router.push(`/dashboard/record-conversation?search=${encodeURIComponent(convId)}`)
  }

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
  }

  const handleToggleRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    )
  }

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    )
    setIsOpenNotifications(false)
    router.push(item.link)
  }

  const handleLogout = async () => {
    setIsOpenProfile(false)
    await supabase.auth.signOut()
    try { localStorage.removeItem('andima_user') } catch {}
    router.push('/login')
  }

  const hasAnyResults = searchResults && (
    searchResults.jobs.length > 0 ||
    searchResults.conversations.length > 0 ||
    searchResults.customers.length > 0
  )

  return (
    <header className="relative z-50 mb-6 flex min-h-12 items-center justify-between gap-4 border-b border-slate-100/80 pb-4">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-extrabold tracking-wide text-slate-800">ANDIMA CRM</span>
        <span className="text-slate-400">CRM</span>
        <span className="text-slate-300">/</span>
        <span className="font-semibold text-blue-600">{currentLabel}</span>
      </div>

      {/* Center: Global Search Bar with Live Popover Results */}
      <div ref={searchContainerRef} className="relative hidden md:flex flex-1 max-w-sm">
        <div className="flex w-full items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/70 px-3.5 py-1.5 text-xs text-slate-400 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-xs transition-all">
          {isSearching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500 shrink-0" />
          ) : (
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          )}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults && hasAnyResults) setIsOpenResults(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Global search waybill, PIC... (Enter to filter)"
            className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSearchResults(null)
                setIsOpenResults(false)
              }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Instant Search Results Dropdown */}
        {isOpenResults && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-xl animate-in fade-in slide-in-from-top-2">
            {!hasAnyResults && !isSearching ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Tidak ada data yang cocok dengan &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {/* Customers Section */}
                {searchResults && searchResults.customers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Building2 size={11} />
                      <span>Company / Customer</span>
                    </div>
                    <div className="space-y-0.5">
                      {searchResults.customers.map((cust) => (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => handleSelectCustomer(cust.customer_name)}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-blue-50 cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800">{cust.customer_name}</span>
                          <span className="text-[10px] text-slate-400">{cust.city || cust.customer_code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Jobs Section */}
                {searchResults && searchResults.jobs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Briefcase size={11} />
                      <span>Waybill / Jobs</span>
                    </div>
                    <div className="space-y-0.5">
                      {searchResults.jobs.map((j) => (
                        <button
                          key={j.id}
                          type="button"
                          onClick={() => handleSelectJob(j.job_number)}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-blue-50 cursor-pointer"
                        >
                          <div>
                            <p className="font-semibold text-blue-600">#{j.job_number}</p>
                            <p className="text-[10px] text-slate-500">{j.customer || j.task_title || 'Job Task'}</p>
                          </div>
                          <span className="text-[10px] rounded px-1.5 py-0.5 font-medium bg-slate-100 text-slate-600">
                            {j.status || 'Active'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversations Section */}
                {searchResults && searchResults.conversations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <MessageSquare size={11} />
                      <span>Record Conversations</span>
                    </div>
                    <div className="space-y-0.5">
                      {searchResults.conversations.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectConversation(c.job_number || c.conversation_id)}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-blue-50 cursor-pointer"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{c.conversation_id}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{c.summary || `PIC: ${c.sales_pic_name}`}</p>
                          </div>
                          {c.job_number && (
                            <span className="text-[10px] text-blue-600 font-medium">#{c.job_number}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer hint */}
                <div className="border-t border-slate-100 pt-2 px-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Tekan <strong>Enter</strong> untuk filter halaman</span>
                  <ArrowRight size={11} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions and User Profile */}
      <div className="flex shrink-0 items-center gap-3 text-slate-600">
        {/* Notification Bell */}
        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => {
              setIsOpenNotifications((prev) => !prev)
              setIsOpenHelp(false)
              setIsOpenProfile(false)
            }}
            className={`relative rounded-full p-2 transition-colors cursor-pointer ${
              isOpenNotifications ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Functional Notification Panel in Top-Right Corner */}
          {isOpenNotifications && (
            <div className="fixed top-14 right-4 sm:top-16 sm:right-8 lg:right-12 z-[100] w-[360px] sm:w-[390px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-100 text-blue-600">
                      <BellRing className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-tight">Notifikasi Sistem</h3>
                      <p className="text-[10px] text-slate-500">
                        {unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllNotificationsAsRead}
                        title="Tandai semua dibaca"
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span>Baca semua</span>
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Tutup notifikasi"
                      onClick={() => setIsOpenNotifications(false)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 mt-2.5 pt-1 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setActiveNotifTab('all')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeNotifTab === 'all'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    Semua ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveNotifTab('unread')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeNotifTab === 'unread'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    Belum Dibaca ({unreadCount})
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto bg-white">
                {displayedNotifications.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400 mb-2">
                      <Check className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">Tidak ada notifikasi</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {activeNotifTab === 'unread' ? 'Semua notifikasi sudah Anda baca' : 'Belum ada notifikasi baru untuk saat ini'}
                    </p>
                  </div>
                ) : (
                  displayedNotifications.map((item) => {
                    const Icon = item.type === 'meeting' ? Calendar : item.type === 'task' ? Briefcase : Building2
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`group relative flex items-start gap-3 p-3 transition-colors cursor-pointer ${
                          item.read
                            ? 'bg-white hover:bg-slate-50 opacity-80'
                            : 'bg-blue-50/30 hover:bg-blue-50/70'
                        }`}
                      >
                        <div
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl mt-0.5 shadow-2xs ${
                            item.type === 'meeting'
                              ? 'bg-amber-100 text-amber-700'
                              : item.type === 'task'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`text-xs truncate ${item.read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                              {item.title}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">{item.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug mt-0.5 line-clamp-2">
                            {item.desc}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 group-hover:underline">
                              <span>Buka detail</span>
                              <ArrowRight className="h-2.5 w-2.5" />
                            </span>
                          </div>
                        </div>

                        {/* Status Dot / Toggle Action */}
                        <div className="absolute top-3 right-3 flex items-center gap-1">
                          {!item.read ? (
                            <button
                              type="button"
                              onClick={(e) => handleToggleRead(e, item.id)}
                              title="Tandai sudah dibaca"
                              className="h-5 w-5 rounded-md text-slate-300 hover:text-blue-600 hover:bg-blue-100/60 grid place-items-center transition-colors"
                            >
                              <span className="h-2 w-2 rounded-full bg-blue-600" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleToggleRead(e, item.id)}
                              title="Tandai belum dibaca"
                              className="h-5 w-5 rounded-md text-slate-300 hover:text-blue-600 hover:bg-slate-100 grid place-items-center transition-colors"
                            >
                              <Check className="h-3 w-3 text-slate-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 bg-slate-50/60 p-2.5 text-center">
                <Link
                  href="/dashboard/record-conversation"
                  onClick={() => setIsOpenNotifications(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span>Lihat Seluruh Riwayat Log Aktivitas</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Help Circle Modal / Popover */}
        <div ref={helpRef} className="relative">
          <button
            type="button"
            aria-label="Help & Guide"
            onClick={() => {
              setIsOpenHelp((prev) => !prev)
              setIsOpenNotifications(false)
              setIsOpenProfile(false)
            }}
            className={`rounded-full p-2 transition-colors cursor-pointer ${
              isOpenHelp ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Quick Help Popover */}
          {isOpenHelp && (
            <div className="fixed top-14 right-4 sm:top-16 sm:right-8 lg:right-12 z-[100] w-80 sm:w-96 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900">Andima CRM Quick Guide</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpenHelp(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-2.5 text-xs text-slate-600">
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5">
                  <p className="font-semibold text-blue-900">Global Search</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Ketik minimal 2 karakter untuk mencari Nomor Job, PIC, atau Perusahaan. Tekan <strong>Enter</strong> untuk langsung memfilter daftar.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 p-2.5">
                  <p className="font-semibold text-slate-800">Company List</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Kelola data pelanggan, informasi PIC, buat jadwal meeting langsung, dan ekspor data ke Excel/PDF.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 p-2.5">
                  <p className="font-semibold text-slate-800">Meeting Schedule</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Atur janji temu dengan perusahaan rekanan dan tugaskan perwakilan tim sales/lapangan.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 p-2.5">
                  <p className="font-semibold text-slate-800">Field Agent</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Lihat penugasan aktif (My Tasks), riwayat tugas (History), serta integrasi tim operasional lapangan.
                  </p>
                </div>
              </div>

              <div className="mt-3.5 border-t border-slate-100 pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Versi Sistem: 1.0.0</span>
                <span className="font-medium text-slate-600">Squad A1 &bull; Andima</span>
              </div>
            </div>
          )}
        </div>

        {/* User Badge & Profile Menu */}
        <div ref={profileRef} className="relative pl-1">
          <button
            type="button"
            onClick={() => {
              setIsOpenProfile((prev) => !prev)
              setIsOpenNotifications(false)
              setIsOpenHelp(false)
            }}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 transition-colors text-left cursor-pointer"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 shadow-2xs">
              {username.slice(0, 1).toLowerCase()}
            </span>
            <div className="hidden sm:block leading-tight text-left">
              <p className="text-xs font-bold text-slate-800">{username}</p>
              <p className="text-[10px] text-slate-400">CRM Staff</p>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {isOpenProfile && (
            <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-slate-100 mb-1">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    {username.slice(0, 1).toLowerCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{username}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-medium text-emerald-600">Active Session</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

