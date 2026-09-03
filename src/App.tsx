import React, { useState } from 'react';
import { Header } from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';
import { InspectionWizard } from './components/InspectionWizard';
import { QueueDrawer } from './components/QueueDrawer';
import { AuditHistory } from './components/AuditHistory';
import { ShieldCheck, HardDrive, WifiOff } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'history'>('audit');
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 font-sans selection:bg-vku-500 selection:text-white pb-12">
      {/* Sticky Header */}
      <Header
        activeTab={activeTab}
        onOpenQueue={() => setIsQueueOpen(true)}
        onOpenHistory={() => setActiveTab(activeTab === 'audit' ? 'history' : 'audit')}
      />

      {/* Offline Status & Sync Progress Banner */}
      <OfflineBanner />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'audit' ? (
          <InspectionWizard onSurveySubmitted={() => {}} />
        ) : (
          <AuditHistory onBackToAudit={() => setActiveTab('audit')} />
        )}
      </main>

      {/* Queue Drawer Modal */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
      />

      {/* Global Footer */}
      <footer className="mt-8 border-t border-slate-800/80 py-4 px-4 text-center text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-center gap-4 text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-vku-400" />
            VKU Facility Auditor v1.0
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            IndexedDB Local Storage Active
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            Basement Ready
          </span>
        </div>
        <p>Trường Đại học Công nghệ Thông tin & Truyền thông Việt - Hàn (VKU)</p>
      </footer>
    </div>
  );
};

export default App;
