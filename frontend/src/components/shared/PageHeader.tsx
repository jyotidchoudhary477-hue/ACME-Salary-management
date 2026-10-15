import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between animate-rise">
      <div>
        {eyebrow && (
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">{eyebrow}</div>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.5rem] sm:leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-[15px]">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
