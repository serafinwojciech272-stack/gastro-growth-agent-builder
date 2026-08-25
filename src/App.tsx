import React, { useState } from "react";

const services = [
  { title: "Webdesign & Entwicklung", desc: "Moderne Unternehmenswebsites mit Next.js oder Vite. Schnell, responsive und SEO-optimiert.", icon: "🌐" },
  { title: "E-Commerce Lösungen", desc: "Leistungsstarke Online-Shops, die verkaufen. Individuelle Anpassungen und nahtlose Integrationen.", icon: "🛒" },
  { title: "Web Applications", desc: "Individuelle Business Apps und CRM-Systeme zur Automatisierung Ihrer Prozesse.", icon: "⚙️" },
  { title: "AI & Automatisierung", desc: "KI-Agenten und Automatisierungen, die Ihren Workflow beschleunigen und Kosten senken.", icon: "🤖" },
];

const processSteps = [
  { step: "1", title: "Erstgespräch", desc: "Wir analysieren Ihre Anforderungen und definieren das Ziel." },
  { step: "2", title: "Konzept & Design", desc: "Wireframes, UI/UX Design und technische Architektur." },
  { step: "3", title: "Entwicklung", desc: "Agile Umsetzung mit Clean Code und modernen Technologien." },
  { step: "4", title: "Launch & Support", desc: "Deployment, SEO Optimierung und laufende Wartung." },
];

function App() {
  const [formData, setFormData] = useState({ name: "", company: "", email: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Vielen Dank! Wir melden uns innerhalb von 24 Stunden.");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">IT POLAND</span>
            <span className="text-sm text-slate-500 hidden sm:inline">Gliwice, PL</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <a href="#leistungen" className="text-slate-600 hover:text-blue-600 transition">Leistungen</a>
            <a href="#prozess" className="text-slate-600 hover:text-blue-600 transition">Prozess</a>
            <a href="#kontakt" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium">Kostenloses Erstgespräch</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 to-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Deutscher Anspruch. <br /> Polnische Engineering-Power.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl">
              Wir entwickeln Websites, Online-Shops und digitale Systeme für deutsche Unternehmen. Schnell, zuverlässig und auf maximale Konversion ausgelegt.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a href="#kontakt" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-center">
                Projekt besprechen
              </a>
              <a href="#leistungen" className="bg-slate-800 text-white border border-slate-700 px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition text-center">
                Leistungen ansehen
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="leistungen" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Unsere Leistungen</h2>
            <p className="mt-4 text-lg text-slate-600">Alles aus einer Hand – vom Konzept bis zum laufenden Support.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, idx) => (
              <div key={idx} className="bg-slate-50 p-6 rounded-xl border border-slate-200 hover:shadow-lg transition duration-300">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-slate-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="prozess" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Unser Prozess</h2>
            <p className="mt-4 text-lg text-slate-600">Transparent, schnell und ergebnisorientiert.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {processSteps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-600 h-full">
                  <div className="text-blue-600 text-2xl font-bold mb-2">{step.step}</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-600 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Lead Form Section */}
      <section id="kontakt" className="py-20 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Kostenloses Erstgespräch</h2>
            <p className="mt-4 text-lg text-slate-400">Beschreiben Sie Ihr Projekt. Wir melden uns innerhalb von 24 Stunden.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="bg-slate-800 p-8 rounded-2xl shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
              <input 
                type="text" 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleChange}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Unternehmen</label>
              <input 
                type="text" 
                name="company" 
                value={formData.company} 
                onChange={handleChange}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">E-Mail</label>
              <input 
                type="email" 
                name="email" 
                required 
                value={formData.email} 
                onChange={handleChange}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Projektbeschreibung</label>
              <textarea 
                name="message" 
                rows={4}
                value={formData.message} 
                onChange={handleChange}
                className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              ></textarea>
            </div>
            <div className="sm:col-span-2 text-center">
              <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto">
                Projekt anfragen
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} IT POLAND. Alle Rechte vorbehalten.</p>
          <p className="mt-2">Gliwice, Poland | Erstellt mit autonomer AI-Engineering-Power</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
