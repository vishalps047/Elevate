import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AppProvider, useApp } from "./context/AppContext";
import Navbar from "./components/Navbar";
import LoginPage from "./pages/LoginPage";
import CoacheeDashboard from "./pages/CoacheeDashboard";
import CoachesPage from "./pages/CoachesPage";
import SessionsPage from "./pages/SessionsPage";
import CoachDashboard from "./pages/CoachDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, user } = useApp();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

function LoginGuard({ children }) {
  const { isAuthenticated, loading, user } = useApp();
  if (loading) return null;
  if (isAuthenticated && user) {
    if (user.role === 'coach') return <Navigate to="/coach-dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginGuard><LoginPage /></LoginGuard>} />

          {/* Coachee routes */}
          <Route path="/" element={<ProtectedRoute allowedRoles={['coachee']}><AppLayout><CoacheeDashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/coaches" element={<ProtectedRoute allowedRoles={['coachee']}><AppLayout><CoachesPage /></AppLayout></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute allowedRoles={['coachee']}><AppLayout><SessionsPage /></AppLayout></ProtectedRoute>} />

          {/* Coach routes */}
          <Route path="/coach-dashboard" element={<ProtectedRoute allowedRoles={['coach']}><AppLayout><CoachDashboard /></AppLayout></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />

          {/* Help */}
          <Route path="/help" element={<ProtectedRoute><AppLayout><div className="p-8 text-center text-muted-foreground">Help &amp; Support coming soon</div></AppLayout></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
