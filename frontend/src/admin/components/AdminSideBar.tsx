// src/admin/components/AdminSidebar.tsx
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import metropolia from '../../assets/metropolia_main_logo.png';
import metropoliaSmall from '../../assets/metropolia_logo_small.png';

const linkBase =
  'flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-peach-50 font-heading text-[15px] transition';
const active =
  'bg-peach-50 text-ink font-semibold border border-line';

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  // restore persisted preference
  useEffect(() => {
    const raw = localStorage.getItem('adminSidebarCollapsed');
    if (raw === '1') setCollapsed(true);
  }, []);

  // persist on change
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const W = collapsed ? 'w-30' : 'w-64';

  return (
    <aside
      className={`${W} relative border-r border-line bg-panel p-4 flex flex-col transition-[width] duration-200 ease-out`}
      aria-label="Sivupalkki"
      aria-expanded={!collapsed}
    >
      {/* Brand block (logo on top, text below) */}
      <div className="px-2 pt-3 pb-4 mb-4 flex flex-col items-center border-b border-line/70">
        <img
          src={collapsed ? metropoliaSmall : metropolia}
          alt="Metropolia"
          className={`${collapsed ? 'h-10' : 'h-10'} w-auto select-none transition-[height] duration-200`}
          draggable={false}
        />
        {!collapsed && (
          <div className="mt-2 text-center leading-tight">
            <div className="text-[20px] font-heading font-semibold tracking-tight text-ink">
              HyMy-kylä
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="space-y-1">
        <NavLink
          to="/hallinta"
          end
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : ''} ${collapsed ? 'justify-center px-2' : ''}`
          }
          title="Yhteenveto"
        >
          <LayoutDashboard size={18} />
          {!collapsed && <span>Yhteenveto</span>}
        </NavLink>

        {/* LINKS HERE */}
        <NavLink
          to="/hallinta/analytiikka"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : ''} ${collapsed ? 'justify-center px-2' : ''}`
          }
          title="Analytiikka"
        >
          <BarChart3 size={18} />
          {!collapsed && <span>Analytiikka</span>}
        </NavLink>

        <NavLink
          to="/hallinta/kyselyt"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : ''} ${collapsed ? 'justify-center px-2' : ''}`
          }
          title="Kyselyt"
        >
          <ListChecks size={18} />
          {!collapsed && <span>Kyselyt</span>}
        </NavLink>

        <NavLink
          to="/hallinta/asetukset"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : ''} ${collapsed ? 'justify-center px-2' : ''}`
          }
          title="Asetukset"
        >
          <Settings size={18} />
          {!collapsed && <span>Asetukset</span>}
        </NavLink>
      </nav>

      {/* Collapse toggle — centered vertically at the right edge */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="
          absolute top-1/2 -translate-y-1/2
          -right-3
          h-9 w-9
          flex items-center justify-center
          rounded-full
          border border-line bg-white shadow
          hover:bg-peach-50
          text-ink
        "
        aria-label={collapsed ? 'Laajenna sivupalkki' : 'Pienennä sivupalkki'}
        title={collapsed ? 'Laajenna' : 'Pienennä'}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}