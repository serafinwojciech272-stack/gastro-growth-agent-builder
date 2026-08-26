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
import Footer from "./components/Footer";
import AdvancedAnalytics from "./sections/AdvancedAnalytics";
import GrowthRoadmap from "./sections/GrowthRoadmap";
import FinalCTAEnhanced from "./sections/FinalCTAEnhanced";

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
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
export default App;
