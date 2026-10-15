import { Link, NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { appConfig, navItems } from '../../config';
import { useAuth } from '../../auth/AuthContext';
import { GlobalSearch } from '../shared/GlobalSearch';
import { Button } from '../ui';

function NavIcon({ name }: { name: string }) {
  const common = 'h-5 w-5 shrink-0';
  if (name === 'dashboard') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
      </svg>
    );
  }
  if (name === 'employees') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  if (name === 'analytics') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
  }
  if (name === 'simulator') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    );
  }
  return (
    <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    isActive
      ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`;

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'HR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const displayName = user?.fullName || appConfig.orgName;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <span className="text-lg font-bold tracking-tight sm:text-xl">{appConfig.appName}</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-slate-300 sm:inline">{appConfig.appTagline}</span>
            <div className="hidden md:block">
              <GlobalSearch />
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-xs font-bold">
              {initialsFrom(displayName)}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-57px)] max-w-[1440px]">
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-56 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 md:flex lg:w-60">
          <nav className="flex flex-1 flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={'end' in item ? item.end : false}
                className={linkClass}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto border-t border-slate-100 pt-4">
            <div className="mb-2 truncate px-2 text-xs font-semibold text-slate-800">{displayName}</div>
            <Button size="sm" variant="ghost" className="w-full justify-start" onClick={logout}>
              Log out
            </Button>
          </div>
        </aside>

        <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold ${
                  isActive ? 'text-sky-600' : 'text-slate-500'
                }`
              }
            >
              <NavIcon name={item.icon} />
              {item.label.split(' ')[0]}
            </NavLink>
          ))}
        </div>

        <main className="min-w-0 flex-1 px-4 py-6 pb-20 sm:px-6 sm:py-8 md:pb-8">{children}</main>
      </div>
    </div>
  );
}
