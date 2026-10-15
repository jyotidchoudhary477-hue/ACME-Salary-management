import { Button, Card } from '../ui';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={busy ? undefined : onCancel}
    >
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <Card className="p-6 animate-rise shadow-2xl">
          <h2 id="confirm-dialog-title" className="font-display text-2xl font-semibold text-slate-900">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button variant="danger" onClick={onConfirm} disabled={busy}>
              {busy ? 'Deleting…' : confirmLabel}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
