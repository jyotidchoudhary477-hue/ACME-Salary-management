import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { appConfig } from '../config';
import { useToast } from '../components/shared/Toast';
import { Button, Card, Input, Label } from '../components/ui';

export function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to={from} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim(), password);
      push('Welcome back');
      navigate(from, { replace: true });
    } catch (err) {
      push(err instanceof Error ? err.message : 'Login failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-7 animate-rise">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-teal-600 to-teal-900 text-sm font-bold text-white">
            {appConfig.appName.charAt(0)}
          </div>
          <h1 className="font-display text-3xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">{appConfig.appName}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-teal-800 hover:underline">
            Create account
          </Link>
        </p>
      </Card>
    </div>
  );
}
