import { LanguageProvider } from "./context/LanguageContext";
import Header from "./components/Header";
import Hero from "./sections/Hero";
import Problem from "./sections/Problem";
import Process from "./sections/Process";
import WhatWeBuild from "./sections/WhatWeBuild";
import AIMenuScanner from "./sections/AIMenuScanner";
import HealthScore from "./sections/HealthScore";
import MultiStepForm from "./sections/MultiStepForm";
import Testimonials from "./sections/Testimonials";
import WhyUs from "./sections/WhyUs";
import CaseStudies from "./sections/CaseStudies";
import Pricing from "./sections/Pricing";
import Footer from "./components/Footer";

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
          <Testimonials />
          <MultiStepForm />
          <WhyUs />
          <CaseStudies />
          <Pricing />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
export default App;
