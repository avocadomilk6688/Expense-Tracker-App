// Uses frankfurter.app — free, no API key, ~170 currencies
const API_BASE = "https://api.frankfurter.app/latest?from=USD";
const CACHE_KEY = "fx-rates-cache";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const SUPPORTED_CURRENCIES = [
  { code: "INR", symbol: "₹" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "MYR", symbol: "RM" },
  { code: "SGD", symbol: "S$" },
  { code: "JPY", symbol: "¥" },
  { code: "AUD", symbol: "A$" },
];

export const BASE_CURRENCY = "INR"; 

/**
 * Returns rates where 1 USD = X currency.
 * Cached in localStorage for 1 hour to avoid hammering the API.
 */
export async function getRates() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { rates, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) return rates;
  }

  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error("Network error");
    const data = await res.json();
    // data.rates = { EUR: 0.92, GBP: 0.79, INR: 83.5, MYR: 4.7, ... }
    const rates = { ...data.rates, USD: 1 };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, timestamp: Date.now() }));
    return rates;
  } catch (e) {
    console.warn("FX fetch failed, using fallback rates:", e.message);
    // Fallback static rates (USD base) — update periodically
    return { USD: 1, INR: 83.5, EUR: 0.92, GBP: 0.79, MYR: 4.72, SGD: 1.34, JPY: 151, AUD: 1.53 };
  }
}

/**
 * Convert any amount to INR (base currency).
 * Formula: amount_in_USD = amount / rates[fromCurrency]
 *          amount_in_INR  = amount_in_USD * rates[INR]
 */
export async function toBaseINR(amount, fromCurrency) {
  if (fromCurrency === BASE_CURRENCY) return amount;
  const rates = await getRates();
  const inUSD = amount / (rates[fromCurrency] ?? 1);
  const inINR = inUSD * (rates[BASE_CURRENCY] ?? 83.5);
  return Math.round(inINR * 100) / 100; // 2 decimal places
}

/**
 * Returns a formatted string like "$25 (≈₹2,087)"
 */
export function formatWithOriginal(baseAmount, originalAmount, originalCurrency) {
  const sym = SUPPORTED_CURRENCIES.find(c => c.code === originalCurrency)?.symbol ?? originalCurrency;
  if (originalCurrency === BASE_CURRENCY) return `₹${baseAmount}`;
  return `${sym}${originalAmount} <span class="approx-inr">(≈₹${baseAmount})</span>`;
}

/**
 * Convert from INR (base) to any display currency.
 * Reverse of toBaseINR.
 */
export async function fromBaseINR(inrAmount, toCurrency) {
  if (toCurrency === BASE_CURRENCY) return inrAmount;
  const rates = await getRates();
  const inUSD = inrAmount / (rates[BASE_CURRENCY] ?? 83.5);
  const inTarget = inUSD * (rates[toCurrency] ?? 1);
  return Math.round(inTarget * 100) / 100;
}