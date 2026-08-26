"use client";
import React, { useState } from "react";

export default function AIMenuScanner() {
  const [menu, setMenu] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAnalysis(null);
    try {
      // Symulacja wywołania usługi AI
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setAnalysis("Analyse abgeschlossen. Erwartete Umsatzsteigerung: 8-12%.");
    } catch {
      setAnalysis("Fehler bei der Analyse. Bitte versuchen Sie es später erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ai-scanner" className="py-20 bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">AI Speisekarten-Scanner</h2>
          <p className="text-slate-400">Fügen Sie hier Ihre Speisekarte ein. Unsere AI analysiert sofort Verbesserungspotenziale.</p>
        </div>
        <form onSubmit={handleAnalyze} className="space-y-4">
          <textarea
            className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-4 h-40 focus:ring-2 focus:ring-orange-600 focus:outline-none"
            placeholder="Pizza Margherita - 8€"
            value={menu}
            onChange={(e) => setMenu(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50"
          >
            {loading ? "AI analysiert..." : "Speisekarte analysieren"}
          </button>
        </form>
        {analysis && (
          <div className="mt-8 p-6 bg-slate-800 rounded-xl border border-orange-600">
            <h3 className="text-xl font-bold text-orange-500 mb-2">AI Empfehlung:</h3>
            <p className="text-slate-300">{analysis}</p>
          </div>
        )}
      </div>
    </section>
  );
}
