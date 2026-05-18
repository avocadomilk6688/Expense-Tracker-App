// Stores recurring templates separately. On every app load,
// processDue() checks what's overdue and fires real transactions.

import { toBaseINR } from "./currencyService.js";

const REC_KEY = "recurring-expenses";

// ── CRUD ──────────────────────────────────────────────────────

export function getAllRecurring() {
  return JSON.parse(localStorage.getItem(REC_KEY) || "[]");
}

export function saveRecurring(rec) {
  const all = getAllRecurring();
  const idx = all.findIndex(r => r.id === rec.id);
  if (idx !== -1) all[idx] = rec;
  else all.unshift(rec);
  localStorage.setItem(REC_KEY, JSON.stringify(all));
}

export function deleteRecurring(id) {
  const filtered = getAllRecurring().filter(r => r.id !== id);
  localStorage.setItem(REC_KEY, JSON.stringify(filtered));
}

// ── Due-date logic ────────────────────────────────────────────

function isDue(rec) {
  if (!rec.lastRun) return true; // never run yet → immediately due

  const last = new Date(rec.lastRun);
  const now  = new Date();
  const msElapsed = now - last;
  const DAY_MS = 86_400_000;

  switch (rec.frequency) {
    case "daily":   return msElapsed >= DAY_MS;
    case "weekly":  return msElapsed >= 7 * DAY_MS;
    case "monthly":
      // Due if the calendar month has changed
      return (
        now.getFullYear() > last.getFullYear() ||
        now.getMonth() > last.getMonth()
      );
    default:
      return false;
  }
}

// ── Main engine call (run on app load) ───────────────────────

/**
 * Checks all recurring templates, creates transactions for overdue ones.
 * @param {Function} saveTransFn  — your localStorage.saveTrans function
 * @returns {number}              — count of transactions auto-created
 */
export async function processDue(saveTransFn) {
  const all = getAllRecurring();
  let created = 0;

  for (const rec of all) {
    if (!isDue(rec)) continue;

    const baseAmount = await toBaseINR(rec.amount, rec.currency);

    const trans = {
      id: Math.floor(Math.random() * 10_000_000),
      amount: Math.round(baseAmount),
      originalAmount: rec.amount,
      currency: rec.currency,
      tag: `🔁 ${rec.tag.replace(/\s*\(.*\)$/, '')} (${rec.frequency})`,
      time: new Date().toISOString(),
    };

    saveTransFn(trans);
    rec.lastRun = new Date().toISOString();
    saveRecurring(rec); // update lastRun stamp
    created++;
  }

  return created;
}

// ── HTML helpers ─────────────────────────────────────────────

export function createRecurringItemHTML(rec) {
  const freqLabel = { daily: "Every day", weekly: "Every week", monthly: "Every month" };
  return `
    <div class="recurring-item" data-id="${rec.id}">
      <div>
        <strong>${rec.tag}</strong>
        <span class="trans-date">${rec.currency} ${rec.amount} · ${freqLabel[rec.frequency]}</span>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="edit-rec-btn" data-id="${rec.id}" data-amount="${rec.amount}" data-currency="${rec.currency}">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <button class="del-rec-btn" data-id="${rec.id}">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    </div>`;
}