export async function analyzeMenu(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Analyse abgeschlossen. Erwartete Umsatzsteigerung: 8-12%.");
    }, 1500);
  });
}

