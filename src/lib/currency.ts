/**
 * Format a numeric string into Brazilian Real currency format.
 * Input: raw digits (e.g. "1000000" for R$ 10.000,00)
 * Stores value in centavos internally.
 */
export function formatCurrencyInput(value: string): string {
  // Remove non-digits
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  const num = parseInt(digits, 10);
  const reais = (num / 100).toFixed(2);
  const [intPart, decPart] = reais.split('.');

  // Add thousand separators
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${formatted},${decPart}`;
}

/**
 * Parse a formatted currency string back to centavos (number).
 * "R$ 10.000,50" → 1000050
 */
export function parseCurrencyToNumber(formatted: string): number {
  const digits = formatted.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Format centavos to display string.
 * 1000050 → "R$ 10.000,50"
 */
export function formatCentavos(centavos: number): string {
  const reais = (centavos / 100).toFixed(2);
  const [intPart, decPart] = reais.split('.');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${formatted},${decPart}`;
}
