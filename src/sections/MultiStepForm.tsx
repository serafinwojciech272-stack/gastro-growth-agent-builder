"use client";
import React, { useState } from "react";

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ name: "", challenge: "" });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <section id="onboarding" className="py-20 bg-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Starten Sie jetzt</h2>
          <p className="text-slate-400">Schritt {step} von 3</p>
        </div>
        
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl space-y-6">
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Restaurant Name</label>
              <input type="text" value={data.name} onChange={(e) => setData({...data, name: e.target.value})} className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-600 focus:outline-none" />
              <button onClick={nextStep} className="mt-4 w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition">Weiter</button>
            </div>
          )}
          {step === 2 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Ihre größte Herausforderung</label>
              <textarea value={data.challenge} onChange={(e) => setData({...data, challenge: e.target.value})} className="w-full bg-slate-700 text-white border border-slate-600 rounded-lg px-4 py-2 h-24 focus:ring-2 focus:ring-orange-600 focus:outline-none" />
              <div className="mt-4 flex gap-4">
                <button onClick={prevStep} className="w-full bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition">Zurück</button>
                <button onClick={nextStep} className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition">Weiter</button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Vielen Dank, {data.name}!</h3>
              <p className="text-slate-400 mb-6">Wir haben Ihre Anfrage erhalten und melden uns innerhalb von 24 Stunden.</p>
              <button onClick={() => setStep(1)} className="text-orange-500 hover:text-orange-400">Neue Anfrage starten</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
