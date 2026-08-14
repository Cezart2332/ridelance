/**
 * Textul alternativ al unei fotografii de anunț.
 *
 * Baza nu stochează `alt`-uri scrise de om, deci îl compunem: mașina plus poziția în galerie. Nu
 * descrie ce se vede, dar spune ce e și în ce ordine — suficient pentru cineva care navighează cu
 * cititor de ecran, spre deosebire de „imagine".
 */
export function altFor(title: string, index: number, total: number): string {
  return total > 1 ? `${title} — fotografia ${index + 1} din ${total}` : title
}
