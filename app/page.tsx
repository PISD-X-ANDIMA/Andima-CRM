'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Bell, HelpCircle, Users, Briefcase, 
  LayoutGrid, Headphones, ChevronUp, ChevronRight, 
  Monitor, ShieldAlert 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import InteractionTab from '../components/InteractionTab';
import TaskOfFieldAgent from '../components/TaskOfFieldAgent';
import NeedBackupTab from '../components/NeedBackupTab';

type PageKey = 'RecordConversation' | 'MonitoringIssue' | 'NeedBackup';

export default function CRMDashboard() {
  const router = useRouter();
  const [page, setPage] = useState<PageKey>('RecordConversation');
  const [crmOpen, setCrmOpen] = useState(true);
  const [needBackupSub, setNeedBackupSub] = useState<'eskalasi' | 'pengalihan'>('eskalasi');

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: string;
    email?: string;
  }>({
    name: 'CRM Staff',
    role: 'Sales Exc',
  });
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const isSessionLoggedIn = typeof window !== 'undefined' ? sessionStorage.getItem('andima_logged_in') : null;
        const cached = typeof window !== 'undefined' ? localStorage.getItem('andima_user') : null;
        const { data: { session } } = await supabase.auth.getSession();

        // Jika belum ada tanda login aktif pada browser dan tidak ada session supabase, wajib login dulu
        if (!isSessionLoggedIn && !session) {
          router.replace('/login');
          return;
        }

        let parsedUser: { name: string; role: string; email?: string } | null = null;
        if (cached) {
          try {
            parsedUser = JSON.parse(cached);
          } catch {
            // Ignore parse error
          }
        }

        const user = session?.user;
        if (user) {
          let name = user.user_metadata?.full_name || parsedUser?.name || 'CRM Staff';
          let role = parsedUser?.role || 'Sales Exc';

          try {
            const { data: profile } = await supabase
              .from('b2_register')
              .select('full_name, employment_status, position_id')
              .eq('id', user.id)
              .maybeSingle();

            if (profile?.full_name) {
              name = profile.full_name;
            }
          } catch (e) {
            console.warn(e);
          }

          const userData = { name, role, email: user.email };
          setCurrentUser(userData);
          if (typeof window !== 'undefined') {
            localStorage.setItem('andima_user', JSON.stringify(userData));
            sessionStorage.setItem('andima_logged_in', 'true');
          }
        } else if (parsedUser) {
          setCurrentUser(parsedUser);
        } else {
          router.replace('/login');
          return;
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        router.replace('/login');
      } finally {
        setIsAuthChecking(false);
      }
    }

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('andima_user');
      sessionStorage.removeItem('andima_logged_in');
    }
    router.replace('/login');
  };

  if (isAuthChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#07111F] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#3B6FF5] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-slate-300">Menghubungkan ke Andima CRM...</p>
        </div>
      </div>
    );
  }

  const pageBreadcrumb = page === 'RecordConversation' 
    ? 'Record Coversation' 
    : page === 'MonitoringIssue' 
    ? 'Monitoring Issue' 
    : 'Need Backup';

  if (isAuthChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#07111F] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#3B6FF5] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-slate-300">Menghubungkan ke Andima CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f4f7fa] font-sans antialiased text-slate-800">
      {/* SIDEBAR */}
      <aside className="w-56 bg-[#07111e] text-slate-300 flex flex-col h-full shrink-0 z-20 select-none">
        {/* LOGO BRAND */}
        <div className="pt-6 pb-5 px-5">
          <div className="flex items-center gap-2.5">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-ANDIMA-wzx4gpZx20EFE5IYcH3jqabixELIo3.png"
              alt="Logo ANDIMA"
              className="w-10 h-auto object-contain shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/Logo-ANDIMA.png';
              }}
            />
            <div className="flex flex-col justify-center">
              <h1 className="text-white font-extrabold text-[14px] tracking-[0.12em] leading-tight">ANDIMA</h1>
              <h2 className="text-white font-extrabold text-[10.5px] tracking-[0.08em] leading-tight mt-0.5">TRANSPORTINDO</h2>
            </div>
          </div>
          <p className="text-[7px] text-[#38bdf8] font-bold tracking-[0.16em] mt-2 uppercase">ENTERPRISE DIGITAL ECOSYSTEM</p>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {/* Dashboard */}
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-medium"
          >
            <LayoutGrid size={16} className="text-slate-400" />
            <span>Dashboard</span>
          </a>

          {/* CCR */}
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-medium"
          >
            <Headphones size={16} className="text-slate-400" />
            <span>CCR</span>
          </a>

          {/* CRM ACCORDION */}
          <div>
            <button
              onClick={() => setCrmOpen(!crmOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-[#1d4ed8] text-white shadow-xs font-semibold text-xs cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Users size={16} className="text-white" />
                <span className="font-bold tracking-wide">CRM</span>
              </div>
              <ChevronUp size={15} className={`text-white transition-transform ${crmOpen ? '' : 'rotate-180'}`} />
            </button>

            {crmOpen && (
              <div className="ml-4 pl-3 mt-1.5 space-y-0.5 border-l border-slate-700/60 text-xs">
                <button
                  type="button"
                  className="w-full text-left py-1.5 px-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs cursor-pointer"
                >
                  <span className="text-[10px] text-slate-500">•</span>
                  <span>Sales Eksekutif</span>
                </button>

                <button
                  type="button"
                  className="w-full text-left py-1.5 px-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs cursor-pointer"
                >
                  <span className="text-[10px] text-slate-500">•</span>
                  <span>Company List</span>
                </button>

                <button
                  type="button"
                  className="w-full text-left py-1.5 px-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs cursor-pointer"
                >
                  <span className="text-[10px] text-slate-500">•</span>
                  <span>Meeting Schedule</span>
                </button>

                {/* Record Conversation (Active) */}
                <button
                  type="button"
                  onClick={() => setPage('RecordConversation')}
                  className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    page === 'RecordConversation'
                      ? 'bg-[#c5d8ec] text-[#0f172a] shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <span className={`text-[11px] ${page === 'RecordConversation' ? 'text-[#0f172a]' : 'text-slate-500'}`}>•</span>
                  <span>Record Conversation</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPage('MonitoringIssue')}
                  className={`w-full text-left py-1.5 px-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                    page === 'MonitoringIssue' ? 'bg-[#c5d8ec] text-[#0f172a] font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] text-slate-500">•</span>
                  <span>Task Field Agent</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPage('NeedBackup')}
                  className={`w-full text-left py-1.5 px-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                    page === 'NeedBackup' ? 'bg-[#c5d8ec] text-[#0f172a] font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] text-slate-500">•</span>
                  <span>Need Backup</span>
                </button>

                <button
                  type="button"
                  className="w-full text-left py-1.5 px-2 text-slate-400 hover:text-white transition-colors flex items-center justify-between text-xs cursor-pointer"
                >
                  <span>Field Agent</span>
                  <ChevronRight size={13} className="text-slate-500" />
                </button>
              </div>
            )}
          </div>

          {/* HRMS */}
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-xs font-medium"
          >
            <Briefcase size={16} className="text-slate-400" />
            <span>HRMS</span>
          </a>
        </nav>

        {/* LOGOUT BUTTON */}
        <div className="p-6 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 rounded-full border border-red-500 text-red-500 hover:bg-red-500/10 text-xs font-bold transition-all text-center cursor-pointer"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* TOP HEADER */}
        <header className="bg-white border-b border-slate-200/80 px-8 py-3.5 flex items-center justify-between shrink-0 z-10">
          {/* Left: Breadcrumbs & Global Search */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 text-xs">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo-ANDIMA-wzx4gpZx20EFE5IYcH3jqabixELIo3.png"
                alt="Logo ANDIMA"
                className="w-5 h-auto object-contain inline-block shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/Logo-ANDIMA.png';
                }}
              />
              <span className="font-extrabold text-slate-900 tracking-tight">ANDIMA CRM</span>
              <span className="text-slate-400 font-medium">CRM</span>
              <span className="text-slate-400 font-medium">/</span>
              <span className="text-[#2563eb] font-semibold">{page === 'NeedBackup' ? 'Task Field' : pageBreadcrumb}</span>
            </div>

            {/* Global Search Pill */}
            <div className="relative w-80">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Global search waybill, PIC..."
                className="w-full bg-[#f0f4f9] py-1.5 pl-9 pr-4 rounded-full text-xs text-slate-700 outline-none placeholder:text-slate-400 font-medium border border-transparent focus:border-blue-400 transition-colors"
              />
            </div>
          </div>

          {/* Right: Notifications, Help, User Profile */}
          <div className="flex items-center gap-5">
            <button 
              type="button"
              className="relative text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            <button 
              type="button"
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Help"
            >
              <HelpCircle size={18} />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-full bg-[#a7f3d0] text-[#065f46] flex items-center justify-center font-bold text-xs shadow-2xs">
                {currentUser.name.trim().charAt(0) || 'A'}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 font-medium leading-tight">{currentUser.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto px-8 py-6 z-10 bg-[#f4f7fa]">
          {page === 'RecordConversation' && <InteractionTab currentUser={currentUser} />}
          {page === 'MonitoringIssue' && <TaskOfFieldAgent currentUser={currentUser} />}
          {page === 'NeedBackup' && <NeedBackupTab initialSub={needBackupSub} onSubChange={setNeedBackupSub} />}
        </div>
      </main>
    </div>
  );
}

