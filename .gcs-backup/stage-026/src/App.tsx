import React from "react";
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
import Footer from "./components/Footer";
import PricingCalculator from "./sections/PricingCalculator";
import IntegrationLogos from "./sections/IntegrationLogos";
import BlogPreview from "./sections/BlogPreview";
import AIBlogGenerator from "./sections/AIBlogGenerator";
import SEOChecker from "./sections/SEOChecker";
import LoadingState from "./sections/LoadingState";
import ErrorBoundary from "./sections/ErrorBoundary";

function App() {
  return (
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
          <AIBlogGenerator />
          <SEOChecker />
          <LoadingState />
          <ErrorBoundary />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
export default App;
