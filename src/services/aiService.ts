export async function analyzeMenu(menuText: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  // Bezpieczny fallback: jeśli brak klucza API, symulujemy opóźnienie (demo mode)
  if (!apiKey) {
    console.warn("VITE_OPENROUTER_API_KEY missing. Running in simulated demo mode.");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return "Analyse abgeschlossen (Demo). Fügen Sie VITE_OPENROUTER_API_KEY zu .env.local hinzu, um echte KI-Analysen freizuschalten.";
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Optional headers for OpenRouter analytics:
        // "HTTP-Referer": `${window.location.origin}`,
        // "X-Title": "Gastro Growth Advisor",
      },
      body: JSON.stringify({
        // Używamy taniego i szybkiego modelu do analizy tekstu
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Du bist ein Experte für die Gastronomie. Analysiere die gegebene Speisekarte. Gib 2-3 präzise, datenbasierte Empfehlungen zur Umsatzsteigerung auf Deutsch zurück. Sei prägnant."
          },
          {
            role: "user",
            content: `Analysiere diese Speisekarte: ${menuText}`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw new Error("Die KI-Analyse ist fehlgeschlagen. Bitte versuchen Sie es später erneut.");
  }
}
