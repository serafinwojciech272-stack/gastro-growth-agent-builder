"use client";
import React from "react";
export default function PricingCalculator() { const [val, setVal] = React.useState(100); return <section className="py-20 bg-white"><div className="max-w-4xl mx-auto text-center"><h2 className="text-3xl font-bold text-slate-900 mb-8">ROI Calculator</h2><input type="range" min="0" max="1000" value={val} onChange={(e) => setVal(Number(e.target.value))} /><p className="mt-4 text-xl text-orange-600 font-bold">Expected ROI: {val * 1.5}€</p></div></section>; }
