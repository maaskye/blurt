import { Bell, Folder, Home, Library, Menu, Settings, Users } from 'lucide-react';
import { ElementType } from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <Menu className="w-5 h-5 text-neutral-400" />
        <img src="/branding/blurt-logo.svg" alt="blurt." className="h-8 w-auto" />
      </div>

      <nav className="px-3 flex-1">
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

      <div className="p-3 border-t border-neutral-200">
        <div className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
            OG
          </div>
          <span className="text-sm font-medium text-neutral-700 flex-1">Profile</span>
          <Settings className="w-4 h-4 text-neutral-400" />
        </div>
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
        `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
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
