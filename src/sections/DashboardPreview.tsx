"use client";
import React from "react";
import { TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

const actions = [
  { priority: "HIGH", title: "Staffing anpassen", desc: "Küchendurchsatz bei Stoßzeiten optimieren.", impact: "+12% Umsatz" },
  { priority: "MEDIUM", title: "Pasta Alfredo promoten", desc: "Hohe Marge, aber geringe Sichtbarkeit.", impact: "+8% Marge" },
  { priority: "LOW", title: "Bewertungen antworten", desc: "3 neue 1-Stern Bewertungen unbeantwortet.", impact: "Reputation" }
];

export default function DashboardPreview() {
  return (
    <section id="dashboard" className="py-20 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ihr Action Center</h2>
          <p className="text-slate-400">Die AI sagt Ihnen nicht nur, was passiert. Sie sagt Ihnen, was Sie jetzt tun müssen.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Score Card */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-300 mb-4">Growth Score</h3>
              <div className="text-6xl font-extrabold text-green-500">87</div>
            </div>
            <div className="mt-6 flex items-center text-green-500 text-sm">
              <TrendingUp className="w-4 h-4 mr-2" /> +5 seit letzter Woche
            </div>
          </div>

          {/* Action List */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-300 mb-6">Priorisierte Aktionen</h3>
            <div className="space-y-4">
              {actions.map((a, i) => (
                <div key={i} className="flex items-start space-x-4 p-4 bg-slate-700/50 rounded-lg">
                  {a.priority === "HIGH" ? <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" /> : <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />}
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-white">{a.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${a.priority === "HIGH" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{a.priority}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{a.desc}</p>
                    <div className="mt-2 text-xs text-green-500">{a.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
