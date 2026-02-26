import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { QuickStartPanel } from '../components/QuickStartPanel';
import { Sidebar } from '../components/Sidebar';

export const RootLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-neutral-50 relative overflow-hidden">
      {!sidebarOpen && (
        <div className="h-full w-12 shrink-0 border-r border-neutral-200 bg-white flex items-start justify-center pt-6 relative z-20">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Show sidebar"
            className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-500 shadow-sm hover:text-neutral-700"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className={`h-full shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${sidebarOpen ? 'w-64' : 'w-0'}`}>
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((prev) => !prev)} />
      </div>
      <main className="flex-1 overflow-auto px-12 py-8">
        <Outlet />
      </main>
      <QuickStartPanel />
    </div>
  );
};
