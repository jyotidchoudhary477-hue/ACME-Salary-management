import type { ReactNode } from 'react';

export type TabItem = {
  id: string;
  label: string;
  count?: number | string;
};

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="mb-5 overflow-x-auto">
      <div className="inline-flex min-w-full gap-1 rounded-2xl bg-slate-100/90 p-1 sm:min-w-0" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
                isActive
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {tab.count != null && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                    isActive ? 'bg-teal-50 text-teal-800' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TabPanel({
  when,
  active,
  children,
}: {
  when: string;
  active: string;
  children: ReactNode;
}) {
  if (when !== active) return null;
  return <div className="animate-rise">{children}</div>;
}
