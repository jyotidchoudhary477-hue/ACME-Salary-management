import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { EmployeeCreatePage } from './pages/EmployeeCreatePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ComparePage } from './pages/ComparePage';
import { RaiseSimulatorPage } from './pages/RaiseSimulatorPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/employees/new" element={<EmployeeCreatePage />} />
                <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/raise-simulator" element={<RaiseSimulatorPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/reports" element={<Navigate to="/analytics" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
