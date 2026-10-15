import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { LoadingState } from '../components/shared/LoadingState';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState label="Checking session…" />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
