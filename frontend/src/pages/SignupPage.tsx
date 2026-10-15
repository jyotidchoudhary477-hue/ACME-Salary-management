import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { appConfig } from '../config';
import { useToast } from '../components/shared/Toast';
import { Button, Card, Input, Label } from '../components/ui';

export function SignupPage() {
  const { signup, isAuthenticated, loading } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signup(fullName.trim(), email.trim(), password);
      push('Account created');
      navigate('/', { replace: true });
    } catch (err) {
      push(err instanceof Error ? err.message : 'Signup failed', 'error');
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
          <h1 className="font-display text-3xl font-semibold text-slate-900">Create account</h1>
          <p className="mt-1 text-sm text-slate-500">{appConfig.appName}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label>Full name</Label>
            <Input
              required
              minLength={2}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
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
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Creating…' : 'Sign up'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-teal-800 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
