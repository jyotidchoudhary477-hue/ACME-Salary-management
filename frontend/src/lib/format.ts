export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMoney(amount: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}
