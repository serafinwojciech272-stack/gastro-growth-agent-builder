import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, UtensilsCrossed, Star, Target, CheckCircle2 } from "lucide-react";

const features = [
  { title: "Umsatzanalyse", desc: "Identifikation von Umsatzpotenzialen in Ihrer Speisekarte und Preisstruktur.", icon: BarChart3 },
  { title: "Menü-Optimierung", desc: "Data-driven Gestaltung Ihrer Speisekarte für maximale Rentabilität.", icon: UtensilsCrossed },
  { title: "Bewertungsmanagement", desc: "Automatisierung und Analyse von Google & Yelp Bewertungen.", icon: Star },
  { title: "Lokales Marketing", desc: "Gezielte Kampagnen für Gäste in Ihrer unmittelbaren Umgebung.", icon: Target }
];

const processSteps = [
  { step: "01", title: "Audit", desc: "Wir analysieren Ihre aktuelle Situation: Speisekarte, Preise und Online-Präsenz." },
  { step: "02", title: "Strategie", desc: "Entwicklung eines datenbasierten Wachstumsplans für Ihr Restaurant." },
  { step: "03", title: "Umsetzung", desc: "Optimierung der Karte und Implementierung von Marketing-Automatisierungen." },
  { step: "04", title: "Wachstum", desc: "Messbare Umsatzsteigerung und kontinuierliche Anpassung an den Markt." }
];

export default function PublicSite() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans overflow-x-hidden selection:bg-purple-500/30">
      {/* Header z efektem szkła */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center text-white font-bold text-lg">G</div>
            <span className="text-xl font-bold tracking-tight text-white">Gastro Growth Advisor</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Leistungen</a>
            <a href="#process" className="text-sm text-slate-400 hover:text-white transition-colors">Prozess</a>
            <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Login</Link>
            <Link to="/signup" className="text-sm bg-gradient-to-r from-purple-600 to-orange-500 text-white px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center gap-1.5">
              Kostenlos starten <ArrowRight size={14} />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section z gradientem */}
      <section className="relative pt-20 pb-32 sm:pt-32 sm:pb-40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(168,85,247,0.15),_transparent_60%)]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-purple-400 mb-6">
            Restaurant Intelligence Platform
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Mehr Umsatz für Ihr <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">Restaurant</span>.
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Wir analysieren Ihre Speisekarte, Preise und Bewertungen. Steigern Sie Ihren Gewinn mit datenbasierten KI-Empfehlungen.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
            <a href="#lead" className="group bg-gradient-to-r from-purple-600 to-orange-500 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              Kostenlose Erstanalyse 
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#features" className="bg-slate-900 text-slate-300 border border-slate-800 px-8 py-4 rounded-xl font-semibold hover:bg-slate-800 transition-colors">
              Leistungen ansehen
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-white">Unsere Lösungen</h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">Alles was Sie brauchen, um Ihr Restaurantwachstum zu steuern.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-gradient-to-br group-hover:from-purple-600 group-hover:to-orange-500 transition-all duration-300">
                    <Icon className="text-slate-400 group-hover:text-white transition-colors" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-24 bg-slate-900/30 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-white">Unser Prozess</h2>
            <p className="mt-4 text-lg text-slate-500">In 4 Schritten zum messbaren Erfolg.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {processSteps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="text-5xl font-extrabold text-slate-800/50 mb-4">{step.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{step.desc}</p>
                {idx < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-6 -right-4 text-slate-800">
                    <ArrowRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Lead Form */}
      <section id="lead" className="py-24 sm:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-orange-500"></div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ihre kostenlose Erstanalyse</h2>
            <p className="mb-8 text-slate-500 max-w-md mx-auto">Tragen Sie Ihre E-Mail ein. Wir melden uns innerhalb von 24 Stunden mit einer ersten Einschätzung.</p>
            
            {submitted ? (
              <div className="flex flex-col items-center justify-center gap-4 text-green-400 py-8">
                <CheckCircle2 size={48} />
                <p className="text-xl font-medium">Vielen Dank! Wir melden uns in Kürze.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="restaurant@email.de"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-5 py-3.5 text-white text-sm focus:ring-2 focus:ring-purple-600 focus:outline-none transition-all"
                />
                <button type="submit" className="bg-gradient-to-r from-purple-600 to-orange-500 text-white px-6 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity whitespace-nowrap flex items-center justify-center gap-2">
                  Analyse anfordern <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center text-white font-bold text-sm">G</div>
            <span className="text-sm font-medium text-slate-400">Gastro Growth Advisor</span>
          </div>
          <div className="flex space-x-6 text-sm text-slate-500">
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
            <Link to="/signup" className="hover:text-white transition-colors">Sign up</Link>
            <a href="#" className="hover:text-white transition-colors">Impressum</a>
            <a href="#" className="hover:text-white transition-colors">Datenschutz</a>
          </div>
          <p className="text-sm text-slate-600">&copy; {new Date().getFullYear()} GGA. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
}
