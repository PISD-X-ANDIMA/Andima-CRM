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
  BellRing,
  Settings,
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Menu,
} from 'lucide-react'

const AVATAR_COLOR_MAP: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  purple: 'bg-purple-100 text-purple-700',
}

const routeLabels: Record<string, string> = {
  'sales-executive': 'Sales Eksekutif',
  'company-list': 'Company List',
  'meeting-schedule': 'Meeting Schedule',
  'record-conversation': 'Record Conversation',
  'task-of-field-agent': 'Task Field Agent',
  'need-backup': 'Need Backup',
  'field-agent': 'Field Agent',
  profile: 'User Profile',
  settings: 'Pengaturan & Preferensi',
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
  const [avatarColor, setAvatarColor] = useState('emerald')
  const [avatarStyle, setAvatarStyle] = useState<'initial' | 'icon'>('initial')

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

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Profile Menu & Field Agent States (Frame 10 & 11)
  const [isOpenProfile, setIsOpenProfile] = useState(false)
  const [isOpenFieldAgent, setIsOpenFieldAgent] = useState(false)
  const [selectedFieldAgent, setSelectedFieldAgent] = useState('All Field Agents')
  const [pendingFieldAgent, setPendingFieldAgent] = useState('All Field Agents')
  const [fieldAgentSearch, setFieldAgentSearch] = useState('')
  const profileRef = useRef<HTMLDivElement>(null)

  const FIELD_AGENTS_LIST = useMemo(() => [
    'All Field Agents',
    'Rizky Pratama',
    'Dimas Saputra',
    'Fajar Nugroho',
    'Maudy Setiawan',
    'Nichol'
  ], [])

  const filteredFieldAgents = useMemo(() => {
    if (!fieldAgentSearch.trim()) return FIELD_AGENTS_LIST
    return FIELD_AGENTS_LIST.filter(a => a.toLowerCase().includes(fieldAgentSearch.toLowerCase()))
  }, [FIELD_AGENTS_LIST, fieldAgentSearch])

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
        setIsOpenFieldAgent(false)
      }
    }

    function handleKeyDownGlobal(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpenResults(false)
        setIsOpenNotifications(false)
        setIsOpenHelp(false)
        setIsOpenProfile(false)
        setIsOpenFieldAgent(false)
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

  // Sync avatar personalization
  useEffect(() => {
    const readPrefs = () => {
      try {
        const stored = localStorage.getItem('andima_user_preferences')
        if (stored) {
          const parsed = JSON.parse(stored) as { avatarColor?: string; avatarStyle?: 'initial' | 'icon' }
          if (parsed.avatarColor) setAvatarColor(parsed.avatarColor)
          if (parsed.avatarStyle) setAvatarStyle(parsed.avatarStyle)
        }
      } catch {}
    }
    readPrefs()
    window.addEventListener('andima_preferences_updated', readPrefs)
    return () => window.removeEventListener('andima_preferences_updated', readPrefs)
  }, [])

  // Initialize Dark Mode on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('andima_theme')
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        setIsDarkMode(true)
        document.documentElement.classList.add('dark')
      } else {
        setIsDarkMode(false)
        document.documentElement.classList.remove('dark')
      }
    } catch {}
  }, [])

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        try { localStorage.setItem('andima_theme', 'dark') } catch {}
      } else {
        document.documentElement.classList.remove('dark')
        try { localStorage.setItem('andima_theme', 'light') } catch {}
      }
      return next
    })
  }

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
    <header className="relative z-30 mb-6 flex min-h-12 items-center justify-between gap-2 sm:gap-3 border-b border-slate-100/80 dark:border-slate-800 pb-4">
      {/* Left: Mobile Hamburger & Breadcrumbs */}
      <div className='flex items-center gap-2 text-xs'>
        <button
          type='button'
          onClick={() => {
            window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))
          }}
          className='flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 lg:hidden shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0'
          aria-label='Toggle navigation menu'
        >
          <Menu className='h-4 w-4' />
        </button>
        <div className='flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap'>
          <span className='font-semibold text-slate-400 dark:text-slate-500'>CRM</span>
          <span className='text-slate-300 dark:text-slate-600'>/</span>
          <span className='font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline'>
            {pathname?.includes('field-agent') ? 'FIELD AGENT' : 'SALES EXECUTIVE'}
          </span>
          <span className='text-slate-300 dark:text-slate-600 hidden sm:inline'>/</span>
          <span className='font-bold text-blue-600 dark:text-blue-400 truncate'>{currentLabel}</span>
        </div>
      </div>

      {/* Center: Global Search Bar with Live Popover Results */}
      <div ref={searchContainerRef} className="relative hidden md:flex flex-1 max-w-sm">
        <div className="flex w-full items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 px-3.5 py-1.5 text-xs text-slate-400 focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-xs transition-all">
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
            className="w-full bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSearchResults(null)
                setIsOpenResults(false)
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Instant Search Results Dropdown */}
        {isOpenResults && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-2.5 shadow-xl animate-in fade-in slide-in-from-top-2">
            {!hasAnyResults && !isSearching ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Tidak ada data yang cocok dengan &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {/* Customers Section */}
                {searchResults && searchResults.customers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <Building2 size={11} />
                      <span>Company / Customer</span>
                    </div>
                    <div className="space-y-0.5">
                      {searchResults.customers.map((cust) => (
                        <button
                          key={cust.id}
                          type="button"
                          onClick={() => handleSelectCustomer(cust.customer_name)}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{cust.customer_name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">{cust.city || cust.customer_code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Jobs Section */}
                {searchResults && searchResults.jobs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <Briefcase size={11} />
                      <span>Waybill / Jobs</span>
                    </div>
                    <div className="space-y-0.5">
                      {searchResults.jobs.map((j) => (
                        <button
                          key={j.id}
                          type="button"
                          onClick={() => handleSelectJob(j.job_number)}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <div>
                            <p className="font-semibold text-blue-600 dark:text-blue-400">#{j.job_number}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{j.customer || j.task_title || 'Job Task'}</p>
                          </div>
                          <span className="text-[10px] rounded px-1.5 py-0.5 font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
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
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <MessageSquare size={11} />
                      <span>Record Conversations</span>
                    </div>
                    <div className="space-y-0.5">
                      {searchResults.conversations.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectConversation(c.job_number || c.conversation_id)}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{c.conversation_id}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{c.summary || `PIC: ${c.sales_pic_name}`}</p>
                          </div>
                          {c.job_number && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">#{c.job_number}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer hint */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2 px-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Tekan <strong>Enter</strong> untuk filter halaman</span>
                  <ArrowRight size={11} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions and User Profile */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2.5 text-slate-600 dark:text-slate-300">
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
              isOpenNotifications
                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200'
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
            <div className="fixed top-14 right-4 sm:top-16 sm:right-8 lg:right-12 z-[100] w-[360px] sm:w-[390px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-2xl shadow-slate-900/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="bg-slate-50/80 dark:bg-[#0b1324] border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                      <BellRing className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">Notifikasi Sistem</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
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
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span>Baca semua</span>
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Tutup notifikasi"
                      onClick={() => setIsOpenNotifications(false)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 mt-2.5 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveNotifTab('all')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      activeNotifTab === 'all'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
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
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    Belum Dibaca ({unreadCount})
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto bg-white dark:bg-[#0f172a]">
                {displayedNotifications.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-2">
                      <Check className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tidak ada notifikasi</p>
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
                            ? 'bg-white dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-slate-800/60 opacity-80'
                            : 'bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-900/30'
                        }`}
                      >
                        <div
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl mt-0.5 shadow-2xs ${
                            item.type === 'meeting'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              : item.type === 'task'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`text-xs truncate ${item.read ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-slate-100'}`}>
                              {item.title}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">{item.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mt-0.5 line-clamp-2">
                            {item.desc}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
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
                              className="h-5 w-5 rounded-md text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 grid place-items-center transition-colors"
                            >
                              <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleToggleRead(e, item.id)}
                              title="Tandai belum dibaca"
                              className="h-5 w-5 rounded-md text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 grid place-items-center transition-colors"
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
              <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[#0b1324] p-2.5 text-center">
                <Link
                  href="/dashboard/record-conversation"
                  onClick={() => setIsOpenNotifications(false)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <span>Lihat Seluruh Riwayat Log Aktivitas</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Help Circle Modal / Popover */}
        <div ref={helpRef} className="relative hidden sm:block">
          <button
            type="button"
            aria-label="Help & Guide"
            onClick={() => {
              setIsOpenHelp((prev) => !prev)
              setIsOpenNotifications(false)
              setIsOpenProfile(false)
            }}
            className={`rounded-full p-2 transition-colors cursor-pointer ${
              isOpenHelp
                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Quick Help Popover */}
          {isOpenHelp && (
            <div className="fixed top-14 right-4 sm:top-16 sm:right-8 lg:right-12 z-[100] w-80 sm:w-96 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Andima CRM Quick Guide</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpenHelp(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 p-2.5">
                  <p className="font-semibold text-blue-900 dark:text-blue-300">Global Search</p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400/90 mt-0.5">
                    Ketik minimal 2 karakter untuk mencari Nomor Job, PIC, atau Perusahaan. Tekan <strong>Enter</strong> untuk langsung memfilter daftar.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Company List</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Kelola data pelanggan, informasi PIC, buat jadwal meeting langsung, dan ekspor data ke Excel/PDF.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Meeting Schedule</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Atur janji temu dengan perusahaan rekanan dan tugaskan perwakilan tim sales/lapangan.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Field Agent</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Lihat penugasan aktif (My Tasks), riwayat tugas (History), serta integrasi tim operasional lapangan.
                  </p>
                </div>
              </div>

              <div className="mt-3.5 border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Versi Sistem: 1.0.0</span>
                <span className="font-medium text-slate-600 dark:text-slate-300">Squad A1 &bull; Andima</span>
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          aria-label="Toggle Dark Mode"
          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-amber-300 transition-colors cursor-pointer"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-90 duration-200" />
          ) : (
            <Moon className="h-4 w-4 text-slate-500 hover:text-blue-600 transition-colors" />
          )}
        </button>

        {/* User Badge & Profile Menu Trigger (No Duplicate Avatar in Popover) */}
        <div ref={profileRef} className="relative pl-1">
          <button
            type="button"
            onClick={() => {
              setIsOpenProfile((prev) => !prev)
              setIsOpenNotifications(false)
              setIsOpenHelp(false)
            }}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
          >
            <span className={`grid h-7 w-7 place-items-center rounded-full ${AVATAR_COLOR_MAP[avatarColor] || AVATAR_COLOR_MAP.emerald} text-xs font-bold shadow-2xs`}>
              {avatarStyle === 'icon' ? (
                <User className="h-3.5 w-3.5" />
              ) : (
                username.slice(0, 1).toLowerCase()
              )}
            </span>
            <div className="hidden sm:block leading-tight text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{username}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-400">CRM Staff</p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform ${isOpenProfile ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile & Field Agent Dual-Pane Popover (Frame 10 & 11) */}
          {isOpenProfile && (
            <div className="absolute right-0 top-full mt-2.5 z-50 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-150">
              {/* Frame 11: Select Field Agent Side Panel (Muncul berdampingan di samping menu profile) */}
              {isOpenFieldAgent && (
                <div className="w-64 sm:w-72 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-4 shadow-2xl animate-in fade-in slide-in-from-right-3 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">Select Field Agent</h3>
                    <button
                      type="button"
                      onClick={() => setIsOpenFieldAgent(false)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={fieldAgentSearch}
                      onChange={(e) => setFieldAgentSearch(e.target.value)}
                      placeholder="Search field agent..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Radio List of Field Agents */}
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1 mb-4">
                    {filteredFieldAgents.map((agent) => {
                      const isSelected = pendingFieldAgent === agent
                      return (
                        <div
                          key={agent}
                          onClick={() => setPendingFieldAgent(agent)}
                          className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50/70 dark:bg-blue-900/40 font-semibold text-blue-700 dark:text-blue-400'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                          }`}
                        >
                          <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isSelected ? 'border-2 border-blue-600 dark:border-blue-400' : 'border border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />}
                          </div>
                          <span>{agent}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingFieldAgent(selectedFieldAgent)
                        setIsOpenFieldAgent(false)
                      }}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFieldAgent(pendingFieldAgent)
                        setIsOpenFieldAgent(false)
                      }}
                      className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              {/* Frame 10: Profile Card Popover (Clean, without duplicate user avatar) */}
              <div className="w-52 sm:w-56 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-2.5 shadow-2xl">
                {/* View Field Agent Button (Frame 10 Highlighted Button) */}
                <button
                  type="button"
                  onClick={() => setIsOpenFieldAgent((prev) => !prev)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer shadow-2xs mb-2 ${
                    isOpenFieldAgent
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                      : 'border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-900/40'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>View Field Agent</span>
                  </span>
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isOpenFieldAgent ? '-rotate-180' : ''}`} />
                </button>

                {/* Profile Item */}
                <div className="space-y-0.5">
                  <Link
                    href="/dashboard/profile"
                    onClick={() => {
                      setIsOpenProfile(false)
                      setIsOpenFieldAgent(false)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <User className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Profile</span>
                  </Link>

                  {/* Settings Item */}
                  <Link
                    href="/dashboard/settings"
                    onClick={() => {
                      setIsOpenProfile(false)
                      setIsOpenFieldAgent(false)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Settings</span>
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5 text-red-500" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

