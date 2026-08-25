"use client";
import React from "react";

const testimonials = [
  { name: "Max Müller", role: "Inhaber, Brauhaus München", text: "Die Menü-Analyse hat uns geholfen, die Rentabilität um 15% zu steigern. Absolute Empfehlung!" },
  { name: "Anna Schmidt", role: "Geschäftsführerin, Café Berlin", text: "Endlich ein Tool, das uns sagt, was wir tun sollen, statt nur Daten zu liefern." },
  { name: "Tom Becker", role: "Manager, Pizzeria Hamburg", text: "Der AI Advisor ist wie ein zusätzlicher Geschäftspartner, der nie schläft." }
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Vertrauen von deutschen Gastronomen</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-600 mb-4">"{t.text}"</p>
              <div>
                <h4 className="font-bold text-slate-900">{t.name}</h4>
                <p className="text-sm text-slate-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
