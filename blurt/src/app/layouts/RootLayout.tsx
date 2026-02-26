import { Outlet } from 'react-router-dom';
import { QuickStartPanel } from '../components/QuickStartPanel';
import { Sidebar } from '../components/Sidebar';

export const RootLayout = () => {
  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      <main className="flex-1 overflow-auto px-12 py-8">
        <Outlet />
      </main>
      <QuickStartPanel />
    </div>
  );
};
