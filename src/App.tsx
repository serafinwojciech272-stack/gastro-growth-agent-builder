import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// Statyczne importy dla strony głównej (natychmiastowe ładowanie)
import { LanguageProvider } from "./context/LanguageContext";
import Header from "./components/Header";
import Hero from "./sections/Hero";
import Problem from "./sections/Problem";
import Process from "./sections/Process";
import WhatWeBuild from "./sections/WhatWeBuild";
import AIMenuScanner from "./sections/AIMenuScanner";
import HealthScore from "./sections/HealthScore";
import DashboardPreview from "./sections/DashboardPreview";
import Testimonials from "./sections/Testimonials";
import MultiStepForm from "./sections/MultiStepForm";
import WhyUs from "./sections/WhyUs";
import CaseStudies from "./sections/CaseStudies";
import Pricing from "./sections/Pricing";
import CompetitorAnalysis from "./sections/CompetitorAnalysis";
import ReviewIntelligence from "./sections/ReviewIntelligence";
import FAQ from "./sections/FAQ";
import AdvancedAnalytics from "./sections/AdvancedAnalytics";
import GrowthRoadmap from "./sections/GrowthRoadmap";
import FinalCTAEnhanced from "./sections/FinalCTAEnhanced";
import SocialProof from "./sections/SocialProof";
import NewsletterSignup from "./sections/NewsletterSignup";
import FooterLinks from "./sections/FooterLinks";
import PricingCalculator from "./sections/PricingCalculator";
import IntegrationLogos from "./sections/IntegrationLogos";
import BlogPreview from "./sections/BlogPreview";
import Footer from "./components/Footer";

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

const PublicSite = () => (
  <LanguageProvider>
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <Problem />
        <Process />
        <WhatWeBuild />
        <AIMenuScanner />
        <HealthScore />
        <DashboardPreview />
        <Testimonials />
        <MultiStepForm />
        <WhyUs />
        <CaseStudies />
        <Pricing />
        <CompetitorAnalysis />
        <ReviewIntelligence />
        <FAQ />
        <AdvancedAnalytics />
        <GrowthRoadmap />
        <FinalCTAEnhanced />
        <SocialProof />
        <NewsletterSignup />
        <FooterLinks />
        <PricingCalculator />
        <IntegrationLogos />
        <BlogPreview />
      </main>
      <Footer />
    </div>
  </LanguageProvider>
);

export default function App() {
  return (
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
  );
}
