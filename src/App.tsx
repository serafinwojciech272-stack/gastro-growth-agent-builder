import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PublicSite from "./pages/PublicSite";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load dla ciężkich stron aplikacji (Code Splitting)
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdvisorPage = lazy(() => import("./pages/AdvisorPage"));
const MenuPage = lazy(() => import("./pages/MenuPage"));
const ActionsPage = lazy(() => import("./pages/ActionsPage"));
const WorkspaceModulePage = lazy(() => import("./pages/WorkspaceModulePage"));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<PublicSite />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          <Route path="/app/onboarding" element={<OnboardingPage />} />
          <Route path="/app/dashboard" element={<DashboardPage />} />
          <Route path="/app/advisor" element={<AdvisorPage />} />
          <Route path="/app/menu" element={<MenuPage />} />
          <Route path="/app/actions" element={<ActionsPage />} />
          <Route path="/app/:module" element={<WorkspaceModulePage />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
