'use client';
import React, { useState } from 'react';
import { Search, Bell, HelpCircle, Users, Briefcase, Settings, LayoutGrid, Receipt, MonitorSmartphone, Headphones, ChevronUp, Box, Monitor, ShieldAlert } from 'lucide-react';
import InteractionTab from '../components/InteractionTab';
import FollowUpTab from '../components/FollowUpTab';
import ComplaintsTab from '../components/ComplaintsTab';
import MonitoringIssueTab from '../components/MonitoringIssueTab';
import NeedBackupTab from '../components/NeedBackupTab';

const NavItem = ({ Icon, text }: any) => (
  <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white group">
    <Icon size={18} className="text-slate-400 group-hover:text-white" />
    <span className="text-sm font-medium">{text}</span>
  </a>
);

const TabBtn = ({ label, id, active, setTab, count }: any) => (
  <button onClick={() => setTab(id)} className={`pb-3 text-sm font-medium flex items-center gap-2 ${active ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'}`}>
    {label} {count && <span className={`py-0.5 px-2 rounded-full text-xs font-semibold ${active ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>{count}</span>}
  </button>
);

type PageKey = 'RecordConversation' | 'MonitoringIssue' | 'NeedBackup';

export default function CRMDashboard() {
  const [page, setPage] = useState<PageKey>('RecordConversation');
  const [tab, setTab] = useState('Interaction');
  const [needBackupSub, setNeedBackupSub] = useState<'eskalasi' | 'pengalihan'>('eskalasi');

  const pageName = page === 'RecordConversation' ? tab : page === 'MonitoringIssue' ? 'Monitoring Issue' : 'Need Backup';

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside className="w-64 bg-[#0B1120] text-slate-300 flex flex-col h-full shrink-0 shadow-xl z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white"><Box size={22} /></div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">ANDIMA<br/>TRANSPORTINDO</h1>
            <p className="text-[7px] text-slate-400 font-medium tracking-widest mt-0.5">ENTERPRISE DIGITAL ECOSYSTEM</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-5 overflow-y-auto">
          <div>
            <div className="text-[10px] text-slate-500 font-bold tracking-wider mb-2 px-3">MAIN</div>
            <NavItem Icon={LayoutGrid} text="General Dashboard" />
          </div>

          <div>
            <div className="text-[10px] text-slate-500 font-bold tracking-wider mb-2 px-3">BUSINESS MODUL</div>
            <div className="space-y-1">
              <NavItem Icon={Receipt} text="POS" />
              <div>
                <a href="#" className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-800 text-white">
                  <div className="flex items-center gap-3"><Users size={18} /><span className="text-sm font-bold">CRM</span></div>
                  <ChevronUp size={16} className="text-slate-400" />
                </a>
                <div className="ml-5 pl-4 mt-1 space-y-0.5 border-l border-slate-700">
                  <div className="text-[10px] font-bold text-slate-500 tracking-wider py-2">SALES EXECUTIVE</div>
                  <a href="#" className="block py-2 text-sm text-slate-400 hover:text-white">Company List</a>

                  <button
                    onClick={() => setPage('RecordConversation')}
                    className={`w-full text-left flex items-center justify-between py-2.5 px-3 -ml-3 rounded-lg text-sm font-semibold transition-colors ${page === 'RecordConversation' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  >
                    <span>Record Conversation</span>
                    {page === 'RecordConversation' && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                  </button>

                  <a href="#" className="block py-2 text-sm text-slate-400 hover:text-white">Task of Field Agent</a>

                  <button
                    onClick={() => setPage('MonitoringIssue')}
                    className={`w-full text-left flex items-center gap-2 py-2 text-sm font-medium transition-colors ${page === 'MonitoringIssue' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Monitor size={14} className={page === 'MonitoringIssue' ? 'text-teal-400' : 'text-slate-500'} />
                    Monitoring Issue
                  </button>

                  <div>
                    <button
                      onClick={() => setPage('NeedBackup')}
                      className={`w-full text-left flex items-center gap-2 py-2 text-sm font-medium transition-colors ${page === 'NeedBackup' ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      <ShieldAlert size={14} className={page === 'NeedBackup' ? 'text-teal-400' : 'text-slate-500'} />
                      Need Backup
                    </button>
                    {page === 'NeedBackup' && (
                      <div className="ml-5 pl-3 space-y-0.5 border-l border-slate-700 mt-0.5">
                        <button
                          onClick={() => setNeedBackupSub('eskalasi')}
                          className={`block w-full text-left py-1.5 text-xs font-medium transition-colors ${needBackupSub === 'eskalasi' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          Eskalasi
                        </button>
                        <button
                          onClick={() => setNeedBackupSub('pengalihan')}
                          className={`block w-full text-left py-1.5 text-xs font-medium transition-colors ${needBackupSub === 'pengalihan' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          Pengalihan Penanggung Jawab
                        </button>
                      </div>
                    )}
                  </div>

                  <a href="#" className="block py-2 text-sm text-slate-400 hover:text-white">Field Agent</a>
                </div>
              </div>
              <NavItem Icon={Briefcase} text="HRMS" />
              <NavItem Icon={MonitorSmartphone} text="MID" />
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 font-bold tracking-wider mb-2 px-3">SYSTEM</div>
            <NavItem Icon={Settings} text="Settings" />
          </div>
        </nav>

        <div className="p-4 mt-auto">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-xl border border-slate-700 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-teal-400"><Headphones size={16} /></div>
            <div>
              <div className="text-xs font-bold text-white">Customer Support</div>
              <div className="text-[9px] text-slate-400">24/7 Operations Line</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white border-b px-6 py-3 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4 flex-1 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            <span className="font-bold text-slate-800">ANDIMA CRM</span> / CRM / C-Track / <span className="text-teal-600 font-bold">{pageName}</span>
            <div className="relative w-96 ml-8">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Global search..." className="w-full bg-slate-100 py-1.5 pl-9 pr-4 rounded-full text-sm outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button className="relative text-slate-400"><Bell size={20} /><span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span></button>
            <button className="text-slate-400"><HelpCircle size={20} /></button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-3 text-right">
              <div><div className="text-sm font-bold text-slate-700">Adelia</div><div className="text-[10px] text-slate-500">Dispatcher Level 2</div></div>
              <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">A</div>
            </div>
          </div>
        </header>

        {page === 'RecordConversation' && (
          <div className="bg-white border-b px-8 pt-6 shrink-0 z-10 shadow-sm flex gap-8">
            <button
              onClick={() => setTab('Overview')}
              className={`pb-3 text-sm font-medium transition-all ${tab === 'Overview' ? 'text-teal-600 border-b-2 border-teal-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Overview
            </button>
            <TabBtn id="Interaction" label="Interactions" active={tab === 'Interaction'} setTab={setTab} count="24" />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 z-10">
          {page === 'RecordConversation' && tab === 'Interaction' && <InteractionTab />}
          {page === 'RecordConversation' && tab === 'Overview' && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 shadow-xs">
              <h2 className="text-base font-bold text-slate-800 mb-1">Overview Dashboard</h2>
              <p className="text-xs text-slate-400">Silakan beralih ke tab Interactions untuk memantau rekaman percakapan dan koordinasi agen lapangan.</p>
            </div>
          )}
          {page === 'MonitoringIssue' && <MonitoringIssueTab />}
          {page === 'NeedBackup' && <NeedBackupTab initialSub={needBackupSub} onSubChange={setNeedBackupSub} />}
          {false && <FollowUpTab />}
          {false && <ComplaintsTab />}
        </div>
      </main>
    </div>
  );
}
