export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <div className="relative h-11 w-11">
        <div className="absolute inset-0 rounded-full border-2 border-teal-100" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}
