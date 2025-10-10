
// src/admin/components/AdminSidebar.tsx
import { NavLink } from 'react-router-dom';
import metropolia from '../../assets/metropolia_main_logo.png';

const link =
  'flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-peach-50 font-heading text-[15px]';
const active = 'bg-peach-50 text-ink font-semibold border border-line';

export default function AdminSidebar() {
  return (
    <aside className="w-64 border-r border-line bg-panel p-4">
      {/* Brand block */}
      <div className="px-2 pt-3 pb-4 mb-4 flex flex-col items-center border-b border-line/70">
        <img
          src={metropolia}
          alt="Metropolia"
          className="h-10 w-auto select-none"
          draggable={false}
        />
        <div className="mt-2 text-center leading-tight">
          <div className="text-[20px] font-heading font-semibold tracking-tight text-ink">
            HyMy-kylä
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-1">
        <NavLink to="/hallinta" end className={({ isActive }) => `${link} ${isActive ? active : ''}`}>Yhteenveto</NavLink>
        <NavLink to="/hallinta/vastaukset" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>Vastaukset</NavLink>
        <NavLink to="/hallinta/analytiikka" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>Analytiikka</NavLink>
        <NavLink to="/hallinta/asetukset" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>Asetukset</NavLink>
      </nav>
    </aside>
  );
}

