import { Link } from 'react-router-dom';
import { appConfig } from '../config';
import { useAuth } from '../auth/AuthContext';
import { Button, Card } from '../components/ui';

export function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="animate-rise mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">HR workspace preferences and account.</p>
      </div>

      <Card className="mb-4 p-5">
        <h2 className="text-base font-bold text-slate-900">Organization</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">App name</dt>
            <dd className="font-semibold text-slate-900">{appConfig.appName}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">Organization</dt>
            <dd className="font-semibold text-slate-900">{appConfig.orgName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Tagline</dt>
            <dd className="font-semibold text-slate-900">{appConfig.appTagline}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-slate-500">
          Change these via <code className="rounded bg-slate-100 px-1">frontend/.env</code> and
          <code className="rounded bg-slate-100 px-1">backend/.env</code> — no hardcoding in UI.
        </p>
      </Card>

      <Card className="mb-4 p-5">
        <h2 className="text-base font-bold text-slate-900">Signed-in HR user</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">Name</dt>
            <dd className="font-semibold text-slate-900">{user?.fullName || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">Email</dt>
            <dd className="font-semibold text-slate-900">{user?.email || '—'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Role</dt>
            <dd className="font-semibold uppercase text-slate-900">{user?.role || 'hr'}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="danger" onClick={logout}>
            Log out
          </Button>
          <Link to="/compare">
            <Button variant="secondary">Compare employees</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
