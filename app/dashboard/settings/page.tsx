'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import {
  Palette,
  Sliders,
  ShieldCheck,
  Check,
  User,
  Sparkles,
  Volume2,
  VolumeX,
  TableProperties,
  Calendar,
  Lock,
  ArrowLeft,
  Info
} from 'lucide-react'

export interface UserPreferences {
  avatarColor: 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'purple'
  avatarStyle: 'initial' | 'icon'
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD'
  tableDensity: 'comfortable' | 'compact'
  audioAlerts: boolean
}

const DEFAULT_PREFERENCES: UserPreferences = {
  avatarColor: 'emerald',
  avatarStyle: 'initial',
  dateFormat: 'DD/MM/YYYY',
  tableDensity: 'comfortable',
  audioAlerts: false,
}

const AVATAR_COLORS: Array<{
  id: UserPreferences['avatarColor']
  name: string
  bgClass: string
  textClass: string
  borderClass: string
}> = [
  { id: 'emerald', name: 'Emerald Green', bgClass: 'bg-emerald-100 dark:bg-emerald-950/80', textClass: 'text-emerald-700 dark:text-emerald-300', borderClass: 'border-emerald-500' },
  { id: 'blue', name: 'Royal Blue', bgClass: 'bg-blue-100 dark:bg-blue-950/80', textClass: 'text-blue-700 dark:text-blue-300', borderClass: 'border-blue-500' },
  { id: 'indigo', name: 'Indigo Purple', bgClass: 'bg-indigo-100 dark:bg-indigo-950/80', textClass: 'text-indigo-700 dark:text-indigo-300', borderClass: 'border-indigo-500' },
  { id: 'amber', name: 'Amber Gold', bgClass: 'bg-amber-100 dark:bg-amber-950/80', textClass: 'text-amber-700 dark:text-amber-300', borderClass: 'border-amber-500' },
  { id: 'rose', name: 'Rose Red', bgClass: 'bg-rose-100 dark:bg-rose-950/80', textClass: 'text-rose-700 dark:text-rose-300', borderClass: 'border-rose-500' },
  { id: 'purple', name: 'Deep Violet', bgClass: 'bg-purple-100 dark:bg-purple-950/80', textClass: 'text-purple-700 dark:text-purple-300', borderClass: 'border-purple-500' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'personalization' | 'preferences' | 'security'>('personalization')
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [username, setUsername] = useState('CRM User')
  const [userRole, setUserRole] = useState('CRM Staff')
  const [userEmail, setUserEmail] = useState('')
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  // Security tab states
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  })

  useEffect(() => {
    try {
      const storedPrefs = localStorage.getItem('andima_user_preferences')
      if (storedPrefs) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(storedPrefs) })
      }
    } catch {}

    const loadUserData = async () => {
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
          if (!userEmail && session.user.email) setUserEmail(session.user.email)
          const metaName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0]
          if (metaName && username === 'CRM User') setUsername(metaName)
        }
      } catch {}
    }

    void loadUserData()
  }, [])

  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    try {
      localStorage.setItem('andima_user_preferences', JSON.stringify(preferences))
      window.dispatchEvent(new Event('andima_preferences_updated'))
    } catch {}
  }, [preferences])

  const handleUpdatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
    setSaveStatus('Preferensi berhasil disimpan')
    window.setTimeout(() => setSaveStatus(null), 2500)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Kata sandi minimal harus 6 karakter.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Konfirmasi kata sandi tidak cocok.' })
      return
    }

    setPasswordStatus({ type: 'loading', message: 'Memperbarui kata sandi...' })
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPasswordStatus({ type: 'error', message: error.message || 'Gagal memperbarui kata sandi.' })
        return
      }
      setPasswordStatus({ type: 'success', message: 'Kata sandi berhasil diperbarui.' })
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPasswordStatus({ type: 'error', message: 'Terjadi kendala saat memperbarui kata sandi.' })
    }
  }

  const currentColorConfig = AVATAR_COLORS.find((c) => c.id === preferences.avatarColor) || AVATAR_COLORS[0]

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Kembali ke Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Pengaturan & Preferensi</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Atur preferensi visual, format data aplikasi, dan konfigurasi keamanan akun Anda
          </p>
        </div>

        {saveStatus && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 animate-in fade-in duration-150">
            <Check className="h-4 w-4" />
            <span>{saveStatus}</span>
          </div>
        )}
      </div>

      {/* Account Info Read-Only Banner */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 p-4">
        <div className="flex items-center gap-3">
          <div className={`grid h-12 w-12 place-items-center rounded-2xl ${currentColorConfig.bgClass} ${currentColorConfig.textClass} text-base font-bold shadow-2xs`}>
            {preferences.avatarStyle === 'icon' ? (
              <User className="h-6 w-6" />
            ) : (
              username.slice(0, 1).toLowerCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{username}</p>
              <span className="rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 px-2 py-0.5 text-[10px] font-semibold border border-blue-200/50 dark:border-blue-800/50">
                {userRole}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{userEmail || 'Terhubung via Supabase Auth'}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <Info className="h-4 w-4" />
          <span>Informasi profil dikelola terpusat oleh sistem</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('personalization')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'personalization'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Palette className="h-4 w-4" />
          <span>Visual & Avatar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'preferences'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Preferensi Sistem</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Keamanan</span>
        </button>
      </div>

      {/* TAB 1: VISUAL & AVATAR */}
      {activeTab === 'personalization' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Avatar Color Picker */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Tema Warna Avatar Badge</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Pilih palet warna yang akan digunakan untuk lingkaran inisial profil Anda di header dan menu.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {AVATAR_COLORS.map((item) => {
                const isSelected = preferences.avatarColor === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleUpdatePreference('avatarColor', item.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className={`grid h-10 w-10 place-items-center rounded-xl ${item.bgClass} ${item.textClass} text-sm font-bold`}>
                      {username.slice(0, 1).toLowerCase()}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center">
                      {item.name}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        <Check className="h-3 w-3" />
                        <span>Aktif</span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Avatar Style Option */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Gaya Tampilan Badge</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Tentukan apakah avatar menampilkan huruf inisial nama atau ikon netral.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <button
                type="button"
                onClick={() => handleUpdatePreference('avatarStyle', 'initial')}
                className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all cursor-pointer ${
                  preferences.avatarStyle === 'initial'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${currentColorConfig.bgClass} ${currentColorConfig.textClass} font-bold text-sm`}>
                  {username.slice(0, 1).toLowerCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Huruf Inisial</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Karakter pertama dari nama akun Anda</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleUpdatePreference('avatarStyle', 'icon')}
                className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all cursor-pointer ${
                  preferences.avatarStyle === 'icon'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${currentColorConfig.bgClass} ${currentColorConfig.textClass}`}>
                  <User className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Ikon Pengguna</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Ikon profil standar</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Date Format */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Format Tanggal Standar</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Pilih format penanggalan yang nyaman digunakan pada tabel dan jadwal meeting.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <button
                type="button"
                onClick={() => handleUpdatePreference('dateFormat', 'DD/MM/YYYY')}
                className={`flex items-center justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                  preferences.dateFormat === 'DD/MM/YYYY'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">DD/MM/YYYY (Standar Indonesia)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Contoh: 09/10/2026</p>
                </div>
                {preferences.dateFormat === 'DD/MM/YYYY' && (
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleUpdatePreference('dateFormat', 'YYYY-MM-DD')}
                className={`flex items-center justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                  preferences.dateFormat === 'YYYY-MM-DD'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">YYYY-MM-DD (Standar ISO)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Contoh: 2026-10-09</p>
                </div>
                {preferences.dateFormat === 'YYYY-MM-DD' && (
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            </div>
          </div>

          {/* Table Density */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <TableProperties className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Kepadatan Baris Tabel (Density)</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Atur kenyamanan ruang baca pada daftar data (Company List, Tasks, dsb).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <button
                type="button"
                onClick={() => handleUpdatePreference('tableDensity', 'comfortable')}
                className={`flex items-center justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                  preferences.tableDensity === 'comfortable'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Comfortable (Nyaman)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Jarak padding lega untuk kemudahan visual</p>
                </div>
                {preferences.tableDensity === 'comfortable' && (
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleUpdatePreference('tableDensity', 'compact')}
                className={`flex items-center justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                  preferences.tableDensity === 'compact'
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Compact (Rapat)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Muat lebih banyak baris data dalam satu layar</p>
                </div>
                {preferences.tableDensity === 'compact' && (
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            </div>
          </div>

          {/* Audio Chime Notification */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {preferences.audioAlerts ? (
                    <Volume2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-slate-400" />
                  )}
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Suara Notifikasi</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Bunyikan nada singkat ketika ada notifikasi rapat atau tugas penting yang masuk
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleUpdatePreference('audioAlerts', !preferences.audioAlerts)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  preferences.audioAlerts ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    preferences.audioAlerts ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-2xs max-w-lg">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Perbarui Kata Sandi Akun</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Ganti kata sandi akun Supabase Anda secara aman. Minimal 6 karakter.
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>

              {passwordStatus.message && (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold ${
                    passwordStatus.type === 'error'
                      ? 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400'
                      : passwordStatus.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400'
                      : 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-400'
                  }`}
                >
                  {passwordStatus.message}
                </div>
              )}

              <button
                type="submit"
                disabled={passwordStatus.type === 'loading'}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
              >
                {passwordStatus.type === 'loading' ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
