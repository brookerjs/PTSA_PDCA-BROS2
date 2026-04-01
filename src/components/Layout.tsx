import { type ReactNode } from 'react';
import { LayoutGrid, FileText, Settings } from 'lucide-react';
import SyncBar from './SyncBar';
import type { Page } from '../App';

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <header className="bg-navy text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/pt-monogram.png" alt="Premier Tech" className="w-8 h-8 rounded" />
          <div>
            <h1 className="text-base font-semibold leading-tight">BROS2 PDCA <span className="text-[10px] font-normal text-white/40">v0.9.1</span></h1>
            <p className="text-xs text-white/60">Premier Tech Systems & Automation</p>
          </div>
        </div>
        <SyncBar />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Side navigation */}
        <nav className="w-56 bg-white border-r border-gray-200 flex flex-col py-2">
          <button
            onClick={() => onNavigate('register')}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
              currentPage === 'register'
                ? 'bg-light-blue text-navy font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutGrid size={18} />
            Registre PDCA
          </button>
          <button
            onClick={() => onNavigate('build-notes')}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
              currentPage === 'build-notes'
                ? 'bg-light-blue text-navy font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText size={18} />
            Notes de version
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
              currentPage === 'settings'
                ? 'bg-light-blue text-navy font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings size={18} />
            Parametres
          </button>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
