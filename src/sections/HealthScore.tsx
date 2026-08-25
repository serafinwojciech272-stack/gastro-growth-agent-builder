"use client";
import React, { useState } from "react";

export default function HealthScore() {
  const [guests, setGuests] = useState(50);
  const [review, setReview] = useState(4.2);
  const score = Math.min(100, Math.round((guests / 2) + (review * 10)));

  return (
    <section id="health" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8">Restaurant Health Score</h2>
        <div className="bg-slate-50 p-8 rounded-2xl shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tägliche Gäste: {guests}</label>
            <input type="range" min="10" max="200" value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Google Bewertung: {review} Sterne</label>
            <input type="range" min="1" max="5" step="0.1" value={review} onChange={(e) => setReview(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
          </div>
          <div className="pt-4">
            <div className="text-5xl font-extrabold text-orange-600">{score}</div>
            <p className="text-slate-500 mt-2">Ihr aktueller Wachstums-Score</p>
          </div>
        </div>
      </div>
    </section>
  );
}
