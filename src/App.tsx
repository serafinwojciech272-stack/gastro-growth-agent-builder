"use client";

import React, { useState } from "react";

const features = [
  { title: "Umsatzanalyse", desc: "Identifikation von Umsatzpotenzialen in Ihrer Speisekarte und Preisstruktur.", icon: "📊" },
  { title: "Menü-Optimierung", desc: "Data-driven Gestaltung Ihrer Speisekarte für maximale Rentabilität.", icon: "🍽️" },
  { title: "Bewertungsmanagement", desc: "Automatisierung und Analyse von Google & Yelp Bewertungen.", icon: "⭐" },
  { title: "Lokales Marketing", desc: "Gezielte Kampagnen für Gäste in Ihrer unmittelbaren Umgebung.", icon: "🎯" },
];

function App() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Vielen Dank! Wir analysieren Ihr Restaurantpotenzial.");
  };

  return (
    <div className="min-h-screen bg-orange-50 text-slate-900 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🍴</span>
            <span className="text-xl font-bold text-orange-600">Gastro Growth Advisor</span>
          </div>
          <a href="#cta" className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition font-medium text-sm sm:text-base">
            Gratis Analyse
          </a>
        </nav>
      </header>

      <section className="bg-gradient-to-br from-slate-900 to-orange-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Mehr Umsatz für Ihr Restaurant.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl">
              Wir analysieren Ihre Speisekarte, Preise und Bewertungen. Steigern Sie Ihren Gewinn mit datenbasierten Empfehlungen.
            </p>
            <a href="#cta" className="mt-10 inline-block bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition text-center">
              Jetzt kostenlos starten
            </a>
          </div>
        </div>
      </section>

      <section id="leistungen" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Unsere Lösungen</h2>
            <p className="mt-4 text-lg text-slate-600">Wachstum für die Gastronomie.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, idx) => (
              <div key={idx} className="bg-orange-50 p-6 rounded-xl border border-orange-100 hover:shadow-lg transition duration-300">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ihre kostenlose Erstanalyse</h2>
          <p className="mb-8 text-slate-400">Tragen Sie Ihre E-Mail ein. Wir melden uns mit einer ersten Einschätzung.</p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="restaurant@email.de"
              className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-600 focus:outline-none"
            />
            <button type="submit" className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition whitespace-nowrap">
              Analyse anfordern
            </button>
          </form>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-500 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Gastro Growth Advisor. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
