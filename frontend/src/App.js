import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AppProvider } from "./context/AppContext";
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
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Login/Role Selection - no navbar */}
          <Route path="/login" element={<LoginPage />} />

          {/* Coachee routes */}
          <Route path="/" element={<AppLayout><CoacheeDashboard /></AppLayout>} />
          <Route path="/coaches" element={<AppLayout><CoachesPage /></AppLayout>} />
          <Route path="/sessions" element={<AppLayout><SessionsPage /></AppLayout>} />

          {/* Coach routes */}
          <Route path="/coach-dashboard" element={<AppLayout><CoachDashboard /></AppLayout>} />
          <Route path="/coach-history" element={<AppLayout><CoachDashboard /></AppLayout>} />
          <Route path="/coach-calendar" element={<AppLayout><CoachDashboard /></AppLayout>} />

          {/* Admin routes */}
          <Route path="/admin-dashboard" element={<AppLayout><AdminDashboard /></AppLayout>} />
          <Route path="/admin-coaches" element={<AppLayout><AdminDashboard /></AppLayout>} />
          <Route path="/admin-coachees" element={<AppLayout><AdminDashboard /></AppLayout>} />
          <Route path="/admin-reports" element={<AppLayout><AdminDashboard /></AppLayout>} />

          {/* Help */}
          <Route path="/help" element={<AppLayout><div className="p-8 text-center text-muted-foreground">Help &amp; Support coming soon</div></AppLayout>} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
