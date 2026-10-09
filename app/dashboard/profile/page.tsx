'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Shield,
  ArrowLeft,
  Settings,
  LogOut,
  BadgeCheck,
  MapPin
} from 'lucide-react'

const AVATAR_COLOR_MAP: Record<string, string> = {
  emerald: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  blue: 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  indigo: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
  amber: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  rose: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700',
  purple: 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700',
}

export default function ProfilePage() {
  const router = useRouter()
  const [username, setUsername] = useState('Yuliana')
  const [userRole, setUserRole] = useState('Sales Executive')
  const [userEmail, setUserEmail] = useState('yuliana@andima.co.id')
  const [avatarColor, setAvatarColor] = useState('emerald')
  const [avatarStyle, setAvatarStyle] = useState<'initial' | 'icon'>('initial')

  useEffect(() => {
    try {
      const storedPrefs = localStorage.getItem('andima_user_preferences')
      if (storedPrefs) {
        const parsed = JSON.parse(storedPrefs) as { avatarColor?: string; avatarStyle?: 'initial' | 'icon' }
        if (parsed.avatarColor) setAvatarColor(parsed.avatarColor)
        if (parsed.avatarStyle) setAvatarStyle(parsed.avatarStyle)
      }
    } catch {}

    const loadUser = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('andima_user') || 'null') as {
          name?: string
          role?: string
          email?: string
        } | null
        if (storedUser?.name) setUsername(storedUser.name)
        if (storedUser?.role) setUserRole(storedUser.role)
        if (storedUser?.email) setUserEmail(storedUser.email)
      } catch {}

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          if (session.user.email) setUserEmail(session.user.email)
          const metaName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
          if (metaName) setUsername(metaName)
        }
      } catch {}
    }

    void loadUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    try { localStorage.removeItem('andima_user') } catch {}
    router.push('/login')
  }

  const colorClasses = AVATAR_COLOR_MAP[avatarColor] || AVATAR_COLOR_MAP.emerald

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">User Profile</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Informasi identitas akun dan hak akses sistem PT Andima Transportindo
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Settings className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>Pengaturan Akun</span>
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 transition-colors shadow-2xs cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Profile Identity Card */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar Ring */}
          <div className={`grid h-20 w-20 place-items-center rounded-3xl border-2 ${colorClasses} text-2xl font-black shadow-md shrink-0`}>
            {avatarStyle === 'icon' ? (
              <User className="h-10 w-10" />
            ) : (
              username.slice(0, 1).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{username}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <BadgeCheck className="h-3.5 w-3.5" />
                <span>Active Account</span>
              </span>
            </div>

            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{userRole}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span>CRM & Commercial Operations &bull; PT Andima Transportindo</span>
            </p>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact & Account Credentials */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Informasi Kontak & Akun
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span>Email Address</span>
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{userEmail}</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>WhatsApp / Phone</span>
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">+62 812-9842-1082</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>Work Location</span>
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">Tanjung Priok, Jakarta Utara</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                <span>Auth Provider</span>
              </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 text-right">Supabase Secure Auth</span>
            </div>
          </div>
        </section>

        {/* Division & System Assignment */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building2 className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Penugasan & Peran Sistem
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-400">Employee ID</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">EMP-CRM-0941</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-400">Department</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Commercial & Forwarding</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-400">Squad Assignment</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Squad A1 &bull; Sales Executive</span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined Period</span>
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Maret 2026</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
