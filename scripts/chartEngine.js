// ═══════════════════════════════════════════════════════════════════
//  chartEngine.js — Chart.js Data Visualization Module
//
//  Software Evolution Context:
//    Original Limitation: Single basic pie chart showing only
//    total expense vs. budget remaining. No category breakdown,
//    no historical trends, no dynamic updates beyond page load.
//
//    Enhancement: A full analytics dashboard with:
//      1. Category Spending Doughnut Chart (breakdown per tag)
//      2. Monthly Spending Trend Line Chart (last 6 months)
//      3. Dynamic updates on every transaction change
//      4. Empty-state handling
//      5. Responsive + accessible design
// ═══════════════════════════════════════════════════════════════════

import { getAllTrans } from "./firebaseStore.js";
import { fromBaseINR, SUPPORTED_CURRENCIES } from "./currencyService.js";

// ─── Module-level chart instances ────────────────────────────────────
let doughnutChartInstance = null;
let trendChartInstance = null;

// ─── Color palette (accessible, distinct, consistent) ───────────────
const CHART_PALETTE = [
  "#8b8dff", // purple-blue
  "#FCE38A", // yellow
  "#F38181", // red-pink
  "#297054b0", // green
  "#98deff", // light-blue
  "#FEBE8C", // orange
  "#A8D8EA", // sky
  "#AA96DA", // lavender
  "#C6E2B5", // mint
  "#FFAAA5", // salmon
  "#D4A5A5", // dusty rose
  "#B5EAD7", // seafoam
];

// ─── Utility: Normalize tag name (strip recurring prefix/suffix) ────
function normalizeTag(tagStr) {
  if (!tagStr) return "Uncategorized";
  return tagStr
    .replace(/^🔁\s*/, "")
    .replace(/\s*\((daily|weekly|monthly)\)$/i, "")
    .trim() || "Uncategorized";
}

// ─── Utility: Display currency symbol ───────────────────────────────
function getCurrencySymbol(code) {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

// ═══════════════════════════════════════════════════════════════════
//  DATA AGGREGATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Aggregates transaction amounts by category tag for the current month.
 * @param {Array} transactions  Raw transactions from Firestore
 * @param {string} displayCurrency  Target display currency code
 * @returns {Promise<{labels: string[], amounts: number[]}>}
 */
export async function buildCategoryChartData(transactions, displayCurrency = "INR") {
  if (!transactions || transactions.length === 0) {
    return { labels: [], amounts: [] };
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Accumulate base-currency (INR) totals per normalized tag
  const categoryMap = {};
  for (const trans of transactions) {
    const transDate = new Date(trans.time);
    if (
      transDate.getMonth() !== currentMonth ||
      transDate.getFullYear() !== currentYear
    ) {
      continue; // Only current month
    }

    const tag = normalizeTag(trans.tag);
    categoryMap[tag] = (categoryMap[tag] ?? 0) + (trans.amount ?? 0);
  }

  if (Object.keys(categoryMap).length === 0) {
    return { labels: [], amounts: [] };
  }

  // Convert INR totals to display currency
  const labels = Object.keys(categoryMap);
  const amounts = await Promise.all(
    labels.map((tag) => fromBaseINR(categoryMap[tag], displayCurrency))
  );

  // Sort descending by amount for better chart readability
  const combined = labels.map((label, i) => ({ label, amount: amounts[i] }));
  combined.sort((a, b) => b.amount - a.amount);

  return {
    labels: combined.map((c) => c.label),
    amounts: combined.map((c) => Math.round(c.amount)),
  };
}

/**
 * Aggregates total spending per calendar month for the last 6 months.
 * @param {Array} transactions  Raw transactions from Firestore
 * @param {string} displayCurrency  Target display currency code
 * @returns {Promise<{labels: string[], amounts: number[]}>}
 */
export async function buildMonthlyTrendData(transactions, displayCurrency = "INR") {
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();

  // Build the last 6 months as keys: "YYYY-MM"
  const monthKeys = [];
  const monthLabels = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthKeys.push(key);
    monthLabels.push(`${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`);
  }

  // Accumulate base-currency totals per month
  const monthMap = {};
  monthKeys.forEach((k) => (monthMap[k] = 0));

  if (transactions && transactions.length > 0) {
    for (const trans of transactions) {
      const d = new Date(trans.time);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthMap) {
        monthMap[key] += trans.amount ?? 0;
      }
    }
  }

  // Convert to display currency
  const amounts = await Promise.all(
    monthKeys.map((k) => fromBaseINR(monthMap[k], displayCurrency))
  );

  return {
    labels: monthLabels,
    amounts: amounts.map((v) => Math.round(v)),
  };
}

// ═══════════════════════════════════════════════════════════════════
//  CHART RENDERING
// ═══════════════════════════════════════════════════════════════════

/**
 * Renders or updates the Category Spending Doughnut Chart.
 * @param {string} displayCurrency
 */
export async function renderCategoryDoughnutChart(displayCurrency = "INR") {
  const canvas = document.getElementById("categoryDoughnutChart");
  if (!canvas) return;

  const transactions = await getAllTrans();
  const { labels, amounts } = await buildCategoryChartData(transactions, displayCurrency);
  const sym = getCurrencySymbol(displayCurrency);

  const emptyStateEl = document.getElementById("categoryChartEmpty");

  if (labels.length === 0) {
    // Show empty state, hide canvas
    if (emptyStateEl) emptyStateEl.style.display = "flex";
    canvas.style.display = "none";
    if (doughnutChartInstance) {
      doughnutChartInstance.destroy();
      doughnutChartInstance = null;
    }
    return;
  }

  // Hide empty state, show canvas
  if (emptyStateEl) emptyStateEl.style.display = "none";
  canvas.style.display = "block";

  const colors = labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]);

  if (doughnutChartInstance) {
    // Dynamic update — update data in place without full destroy/recreate
    doughnutChartInstance.data.labels = labels;
    doughnutChartInstance.data.datasets[0].data = amounts;
    doughnutChartInstance.data.datasets[0].backgroundColor = colors;
    doughnutChartInstance.update();
    return;
  }

  doughnutChartInstance = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          label: `Spending (${displayCurrency})`,
          data: amounts,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: "#ffffff",
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { family: "Poppins", size: 11 },
            color: "#444",
            padding: 12,
            boxWidth: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${sym}${ctx.parsed.toLocaleString()}`,
          },
          bodyFont: { family: "Poppins" },
        },
      },
      animation: {
        animateRotate: true,
        duration: 600,
        easing: "easeInOutQuart",
      },
    },
  });
}

/**
 * Renders or updates the Monthly Spending Trend Line Chart.
 * @param {string} displayCurrency
 */
export async function renderMonthlyTrendChart(displayCurrency = "INR") {
  const canvas = document.getElementById("monthlyTrendChart");
  if (!canvas) return;

  const transactions = await getAllTrans();
  const { labels, amounts } = await buildMonthlyTrendData(transactions, displayCurrency);
  const sym = getCurrencySymbol(displayCurrency);

  const emptyStateEl = document.getElementById("trendChartEmpty");
  const allZero = amounts.every((v) => v === 0);

  if (allZero) {
    if (emptyStateEl) emptyStateEl.style.display = "flex";
    canvas.style.display = "none";
    if (trendChartInstance) {
      trendChartInstance.destroy();
      trendChartInstance = null;
    }
    return;
  }

  if (emptyStateEl) emptyStateEl.style.display = "none";
  canvas.style.display = "block";

  if (trendChartInstance) {
    trendChartInstance.data.labels = labels;
    trendChartInstance.data.datasets[0].data = amounts;
    trendChartInstance.update();
    return;
  }

  trendChartInstance = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `Monthly Spending (${displayCurrency})`,
          data: amounts,
          fill: true,
          backgroundColor: "rgba(139, 141, 255, 0.12)",
          borderColor: "#8b8dff",
          borderWidth: 2.5,
          pointBackgroundColor: "#8b8dff",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4, // smooth curve
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Label is clear from the chart title
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${sym}${ctx.parsed.y.toLocaleString()}`,
          },
          bodyFont: { family: "Poppins" },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "Poppins", size: 11 },
            color: "#666",
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.05)" },
          ticks: {
            font: { family: "Poppins", size: 11 },
            color: "#666",
            callback: (value) => `${sym}${value.toLocaleString()}`,
          },
        },
      },
      animation: {
        duration: 600,
        easing: "easeInOutQuart",
      },
    },
  });
}

// ═══════════════════════════════════════════════════════════════════
//  PUBLIC API — Master update function called from app.js
// ═══════════════════════════════════════════════════════════════════

/**
 * Refreshes all analytics charts with the latest data.
 * Called whenever transactions are added, edited, or deleted.
 * @param {string} displayCurrency
 */
export async function refreshAllCharts(displayCurrency = "INR") {
  await Promise.all([
    renderCategoryDoughnutChart(displayCurrency),
    renderMonthlyTrendChart(displayCurrency),
  ]);
}

/**
 * Destroys all chart instances (e.g., on logout to prevent stale data).
 */
export function destroyAllCharts() {
  if (doughnutChartInstance) {
    doughnutChartInstance.destroy();
    doughnutChartInstance = null;
  }
  if (trendChartInstance) {
    trendChartInstance.destroy();
    trendChartInstance = null;
  }
}
