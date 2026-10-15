import { useState } from 'react';
import { api } from '../../api/client';
import { useToast } from '../shared/Toast';
import { Button, Card } from '../ui';

export function ImportCsvModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const { push } = useToast();
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<{
    createdCount: number;
    skippedCount: number;
    errorCount: number;
    errors: Array<{ line: number; error: string }>;
    skipped: Array<{ line: number; email: string; reason: string }>;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 animate-rise">
        <h2 className="font-display text-2xl font-semibold">Import employees (CSV)</h2>
        <p className="mt-1 text-sm text-slate-500">
          Use the same columns as Export CSV. Duplicate emails are skipped. Preview first, then import.
        </p>

        <div className="mt-4">
          <input
            type="file"
            accept=".csv,text/csv"
            className="mb-3 block w-full text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setCsv(await file.text());
              setPreview(null);
            }}
          />
          <textarea
            value={csv}
            onChange={(e) => {
              setCsv(e.target.value);
              setPreview(null);
            }}
            rows={8}
            placeholder="Paste CSV here…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs outline-none focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/15"
          />
        </div>

        {preview && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="font-semibold text-slate-800">Preview result</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white p-2">
                <div className="text-lg font-bold text-teal-800">{preview.createdCount}</div>
                <div className="text-[11px] text-slate-500">Would create</div>
              </div>
              <div className="rounded-lg bg-white p-2">
                <div className="text-lg font-bold text-amber-700">{preview.skippedCount}</div>
                <div className="text-[11px] text-slate-500">Duplicates</div>
              </div>
              <div className="rounded-lg bg-white p-2">
                <div className="text-lg font-bold text-orange-700">{preview.errorCount}</div>
                <div className="text-[11px] text-slate-500">Errors</div>
              </div>
            </div>
            {preview.errors[0] && (
              <p className="mt-2 text-xs text-orange-700">
                e.g. line {preview.errors[0].line}: {preview.errors[0].error}
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            disabled={busy || !csv.trim()}
            onClick={async () => {
              setBusy(true);
              try {
                const res = await api.importEmployeesCsv(csv, true);
                setPreview(res);
                push('Preview ready', 'info');
              } catch (e) {
                push(e instanceof Error ? e.message : 'Preview failed', 'error');
              } finally {
                setBusy(false);
              }
            }}
          >
            Preview
          </Button>
          <Button
            disabled={busy || !csv.trim()}
            onClick={async () => {
              setBusy(true);
              try {
                const res = await api.importEmployeesCsv(csv, false);
                push(`Imported ${res.createdCount} · skipped ${res.skippedCount}`);
                onClose();
                onDone?.();
              } catch (e) {
                push(e instanceof Error ? e.message : 'Import failed', 'error');
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Working…' : 'Import now'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
