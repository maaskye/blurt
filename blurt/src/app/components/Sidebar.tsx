import { Bell, Folder, Home, Library, Menu, Settings, Users } from 'lucide-react';
import { ElementType, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppState } from '../state';

type Props = {
  isOpen: boolean;
  onToggle: () => void;
};

export const Sidebar = ({ isOpen, onToggle }: Props) => {
  const { authUser, authRequired, signOut, storageMode } = useAppState();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current) {
        return;
      }
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, []);

  return (
    <aside
      className={`h-full w-64 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-[110%]'
      }`}
    >
      <div className="p-6 flex items-center gap-3">
        <button type="button" onClick={onToggle} aria-label="Toggle sidebar" className="text-neutral-400 hover:text-neutral-600">
          <Menu className="w-5 h-5" />
        </button>
        <img src="/branding/blurt-logo.svg" alt="blurt." className="h-8 w-auto" />
      </div>

      <nav className="px-3 flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
        <NavItem to="/" icon={Home} label="Home" />
        <NavItem to="/library" icon={Library} label="Your Library" />
        <NavItem to="/collaborate" icon={Users} label="Collaborate" />
        <NavItem to="/notifications" icon={Bell} label="Notifications" />

        <div className="my-6 border-t border-neutral-200" />

        <div className="px-3 mb-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">Your Folders</div>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors">
          <Folder className="w-5 h-5" />
          <span className="text-sm">Add New</span>
        </button>
      </nav>

      <div className="p-3 border-t border-neutral-200 mt-auto shrink-0 relative" ref={profileMenuRef}>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 rounded-lg transition-colors"
          onClick={() => setProfileMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={profileMenuOpen}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
            OG
          </div>
          <span className="text-sm font-medium text-neutral-700 flex-1">Profile</span>
          <Settings className="w-4 h-4 text-neutral-400" />
        </button>

        {profileMenuOpen && (
          <div className="absolute left-3 right-3 bottom-full mb-2 rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden z-20">
            <div className="px-3 py-2 text-xs text-neutral-500 border-b border-neutral-100">
              Mode: {storageMode}
            </div>
            <div className="px-3 py-2 text-xs text-neutral-500 border-b border-neutral-100 truncate">
              {authRequired ? authUser?.email ?? authUser?.phone ?? 'Not signed in' : 'Local mode (no cloud account)'}
            </div>
            {authRequired ? (
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-neutral-100"
                onClick={() => {
                  setProfileMenuOpen(false);
                  void signOut();
                }}
              >
                Sign out
              </button>
            ) : (
              <div className="px-3 py-2 text-xs text-neutral-500">Switch to cloud mode in `.env` to enable account actions.</div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

type NavItemProps = {
  to: string;
  icon: ElementType;
  label: string;
};

const NavItem = ({ to, icon: Icon, label }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all block ${
          isActive
            ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 font-medium shadow-sm'
            : 'text-neutral-600 hover:bg-neutral-50'
        }`
      }
    >
      <Icon className="w-5 h-5" />
      <span className="text-sm">{label}</span>
    </NavLink>
  );
};
