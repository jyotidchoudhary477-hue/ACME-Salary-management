import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
}) {
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm' };
  const styles = {
    primary:
      'bg-sky-600 text-white hover:bg-sky-700 shadow-sm shadow-sky-900/10 active:scale-[0.98]',
    secondary:
      'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-white/80',
    danger: 'bg-orange-700 text-white hover:bg-orange-800',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/15 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/80 bg-size-[12px] bg-position-[right_12px_center] bg-no-repeat px-3 py-2.5 pr-9 text-sm text-slate-900 outline-none transition hover:border-slate-300 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/15 ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%64748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{children}</label>;
}

export function Badge({
  children,
  tone = 'slate',
}: {
  children: ReactNode;
  tone?: 'slate' | 'green' | 'orange' | 'teal' | 'blue' | 'amber';
}) {
  const map = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200/80',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    orange: 'bg-orange-50 text-orange-800 ring-orange-100',
    teal: 'bg-teal-50 text-teal-800 ring-teal-100',
    blue: 'bg-sky-50 text-sky-800 ring-sky-100',
    amber: 'bg-amber-50 text-amber-800 ring-amber-100',
  };
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${map[tone]}`}>
      {children}
    </span>
  );
}

const AVATAR_COLORS = [
  'bg-teal-700',
  'bg-sky-700',
  'bg-orange-700',
  'bg-indigo-700',
  'bg-emerald-700',
  'bg-rose-700',
  'bg-slate-700',
];

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const color = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  const sizes = { sm: 'h-8 w-8 text-[10px]', md: 'h-10 w-10 text-xs', lg: 'h-16 w-16 text-lg' };
  return (
    <div
      className={`${sizes[size]} ${color} flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-inner ring-2 ring-white`}
    >
      {initials || '?'}
    </div>
  );
}

export function CountryBadge({ code }: { code: string }) {
  const tones: Record<string, 'teal' | 'blue' | 'orange' | 'amber' | 'green' | 'slate'> = {
    IN: 'orange',
    US: 'blue',
    GB: 'teal',
    DE: 'amber',
    SG: 'green',
    AE: 'slate',
  };
  return <Badge tone={tones[code] || 'slate'}>{code}</Badge>;
}
