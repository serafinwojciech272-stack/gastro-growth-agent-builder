import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PublicSite from "./pages/PublicSite";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AdvisorPage = lazy(() => import("./pages/AdvisorPage"));
const WebsiteBuilderPage = lazy(() => import("./pages/WebsiteBuilderPage"));
const MenuPage = lazy(() => import("./pages/MenuPage"));
const ActionsPage = lazy(() => import("./pages/ActionsPage"));
const WorkspaceModulePage = lazy(() => import("./pages/WorkspaceModulePage"));
const LoadingFallback = () => <div className="min-h-screen flex items-center justify-center bg-[#07080c] text-white"><div role="status" aria-label="Loading" className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-violet-400"/></div>;
const Protected = ({ children }: { children: React.ReactNode }) => <ProtectedRoute>{children}</ProtectedRoute>;
export default function App(){return <ErrorBoundary><Suspense fallback={<LoadingFallback/>}><Routes><Route path="/" element={<PublicSite/>}/><Route path="/login" element={<AuthPage/>}/><Route path="/signup" element={<AuthPage/>}/><Route path="/register" element={<AuthPage/>}/><Route path="/reset-password" element={<ResetPasswordPage/>}/><Route path="/app/onboarding" element={<Protected><OnboardingPage/></Protected>}/><Route path="/app/dashboard" element={<Protected><DashboardPage/></Protected>}/><Route path="/app/advisor" element={<Protected><AdvisorPage/></Protected>}/><Route path="/app/website-builder" element={<Protected><WebsiteBuilderPage/></Protected>}/><Route path="/app/website-preview" element={<Protected><Navigate to="/app/website-builder" replace/></Protected>}/><Route path="/app/menu" element={<Protected><MenuPage/></Protected>}/><Route path="/app/actions" element={<Protected><ActionsPage/></Protected>}/><Route path="/app/:module" element={<Protected><WorkspaceModulePage/></Protected>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></Suspense></ErrorBoundary>}
