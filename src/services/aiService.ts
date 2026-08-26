export async function analyzeMenu(menuText: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("Analyse abgeschlossen. Erwartete Umsatzsteigerung: 8-12%.");
    }, 1500);
  });
}
