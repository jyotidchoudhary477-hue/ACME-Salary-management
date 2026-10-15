import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { Badge } from '../ui';

type Hit = {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  country: string;
  jobTitle: string;
  status: string;
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim()) {
      setItems([]);
      return;
    }
    const t = setTimeout(() => {
      api.searchEmployees(q, 8).then((res) => {
        setItems(res.items);
        setOpen(true);
      });
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={boxRef} className="relative w-48 lg:w-72">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => items.length && setOpen(true)}
        placeholder="Search people…"
        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-300 transition focus:border-sky-400 focus:bg-white/15 focus:ring-2 focus:ring-sky-400/30"
      />
      {open && items.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {items.map((hit) => (
            <button
              key={hit.id}
              type="button"
              className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-sky-50"
              onClick={() => {
                setOpen(false);
                setQ('');
                navigate(`/employees/${hit.id}`);
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-900">
                  {hit.firstName} {hit.lastName}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {hit.employeeCode} · {hit.jobTitle} · {hit.department}
                </div>
              </div>
              <Badge tone={hit.status === 'active' ? 'green' : 'slate'}>{hit.country}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
