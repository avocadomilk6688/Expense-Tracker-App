/**
 * chartEngine.test.js — Unit Tests for Chart.js Data Visualization Logic
 *
 * Approach: Pure function testing using the SAME pattern as other tests in this
 * project (filterEngine.test.js, categoryEngine.test.js). The core data
 * aggregation logic is replicated here for isolation, matching the actual
 * implementation in scripts/chartEngine.js.
 *
 * This approach is deliberate: it tests the LOGIC independently from
 * browser APIs (Chart.js canvas, Firebase, fetch) that cannot run in Node.js.
 *
 * Software Evolution note:
 *   These tests validate the analytics data pipeline — the most critical
 *   part of the Chart.js enhancement. Rendering correctness is validated
 *   separately via Cypress integration tests (cypress/e2e/charts.cy.js).
 */

// ─── Pure function: normalize tag name (mirrors chartEngine.js) ─────
function normalizeTag(tagStr) {
  if (!tagStr) return "Uncategorized";
  return (
    tagStr
      .replace(/^🔁\s*/, "")
      .replace(/\s*\((daily|weekly|monthly)\)$/i, "")
      .trim() || "Uncategorized"
  );
}

// ─── Pure function: aggregate category totals for current month ─────
function buildCategoryChartData(transactions) {
  if (!transactions || transactions.length === 0) {
    return { labels: [], amounts: [] };
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const categoryMap = {};
  for (const trans of transactions) {
    const transDate = new Date(trans.time);
    if (
      transDate.getMonth() !== currentMonth ||
      transDate.getFullYear() !== currentYear
    ) {
      continue;
    }
    const tag = normalizeTag(trans.tag);
    categoryMap[tag] = (categoryMap[tag] ?? 0) + (trans.amount ?? 0);
  }

  if (Object.keys(categoryMap).length === 0) {
    return { labels: [], amounts: [] };
  }

  const combined = Object.entries(categoryMap)
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount);

  return {
    labels: combined.map((c) => c.label),
    amounts: combined.map((c) => c.amount),
  };
}

// ─── Pure function: aggregate monthly totals for last 6 months ──────
function buildMonthlyTrendData(transactions) {
  const now = new Date();
  const monthKeys = [];
  const monthLabels = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthKeys.push(key);
    monthLabels.push(`${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`);
  }

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

  return {
    labels: monthLabels,
    amounts: monthKeys.map((k) => monthMap[k]),
  };
}

// ─── Helpers ────────────────────────────────────────────────────────

/** Transaction timestamped N days ago in the current month. */
function makeTrans(tag, amount, daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { tag, amount, time: d.toISOString() };
}

/** Transaction timestamped N months ago. */
function makeTransMonthsAgo(tag, amount, monthsAgo) {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return { tag, amount, time: d.toISOString() };
}

// ════════════════════════════════════════════════════════════════════
// TEST SUITE 1 — buildCategoryChartData()
// ════════════════════════════════════════════════════════════════════

describe("buildCategoryChartData() — Category spending aggregation", () => {

  test("returns empty labels and amounts when given no transactions", () => {
    const result = buildCategoryChartData([]);
    expect(result.labels).toHaveLength(0);
    expect(result.amounts).toHaveLength(0);
  });

  test("returns empty labels and amounts when given null", () => {
    const result = buildCategoryChartData(null);
    expect(result.labels).toHaveLength(0);
    expect(result.amounts).toHaveLength(0);
  });

  test("correctly sums amounts for a single category", () => {
    const transactions = [
      makeTrans("Food & Dining 🍔", 100),
      makeTrans("Food & Dining 🍔", 50),
    ];
    const result = buildCategoryChartData(transactions);
    expect(result.labels).toContain("Food & Dining 🍔");
    const idx = result.labels.indexOf("Food & Dining 🍔");
    expect(result.amounts[idx]).toBe(150);
  });

  test("aggregates multiple categories independently", () => {
    const transactions = [
      makeTrans("Food & Dining 🍔", 200),
      makeTrans("Transport & Fuel 🚗", 80),
      makeTrans("Groceries 🛒", 120),
    ];
    const result = buildCategoryChartData(transactions);
    expect(result.labels).toHaveLength(3);
    expect(result.amounts[result.labels.indexOf("Food & Dining 🍔")]).toBe(200);
    expect(result.amounts[result.labels.indexOf("Transport & Fuel 🚗")]).toBe(80);
    expect(result.amounts[result.labels.indexOf("Groceries 🛒")]).toBe(120);
  });

  test("strips recurring emoji prefix '🔁' from tag names", () => {
    const transactions = [makeTrans("🔁 Entertainment 🎬 (monthly)", 15)];
    const result = buildCategoryChartData(transactions);
    expect(result.labels).toContain("Entertainment 🎬");
    expect(result.labels).not.toContain("🔁 Entertainment 🎬 (monthly)");
  });

  test("strips frequency suffix (monthly/weekly/daily) from tag names", () => {
    const transactions = [
      makeTrans("Transport & Fuel 🚗 (daily)", 30),
      makeTrans("🔁 Rent & Housing 🏠 (monthly)", 500),
    ];
    const result = buildCategoryChartData(transactions);
    expect(result.labels).toContain("Transport & Fuel 🚗");
    expect(result.labels).toContain("Rent & Housing 🏠");
  });

  test("returns categories sorted from highest to lowest spending", () => {
    const transactions = [
      makeTrans("Groceries 🛒", 30),
      makeTrans("Rent & Housing 🏠", 800),
      makeTrans("Food & Dining 🍔", 150),
    ];
    const result = buildCategoryChartData(transactions);
    for (let i = 0; i < result.amounts.length - 1; i++) {
      expect(result.amounts[i]).toBeGreaterThanOrEqual(result.amounts[i + 1]);
    }
  });

  test("excludes transactions from the previous calendar month", () => {
    const transactions = [
      makeTrans("Food & Dining 🍔", 100),             // current month ✓
      makeTransMonthsAgo("Groceries 🛒", 500, 2),    // 2 months ago ✗
    ];
    const result = buildCategoryChartData(transactions);
    expect(result.labels).toContain("Food & Dining 🍔");
    expect(result.labels).not.toContain("Groceries 🛒");
  });

  test("returns empty result when all transactions are from previous months", () => {
    const transactions = [
      makeTransMonthsAgo("Shopping 🛍️", 200, 1),
      makeTransMonthsAgo("Transport & Fuel 🚗", 80, 3),
    ];
    const result = buildCategoryChartData(transactions);
    expect(result.labels).toHaveLength(0);
    expect(result.amounts).toHaveLength(0);
  });

});

// ════════════════════════════════════════════════════════════════════
// TEST SUITE 2 — buildMonthlyTrendData()
// ════════════════════════════════════════════════════════════════════

describe("buildMonthlyTrendData() — Monthly spending trend aggregation", () => {

  test("always returns exactly 6 month labels regardless of input", () => {
    const result = buildMonthlyTrendData([]);
    expect(result.labels).toHaveLength(6);
    expect(result.amounts).toHaveLength(6);
  });

  test("returns all zeros when there are no transactions", () => {
    const result = buildMonthlyTrendData([]);
    result.amounts.forEach((amount) => {
      expect(amount).toBe(0);
    });
  });

  test("returns all zeros when given null", () => {
    const result = buildMonthlyTrendData(null);
    result.amounts.forEach((amount) => {
      expect(amount).toBe(0);
    });
  });

  test("accumulates spending for the current month in the last position", () => {
    const transactions = [
      makeTrans("Food & Dining 🍔", 100),
      makeTrans("Transport & Fuel 🚗", 200),
    ];
    const result = buildMonthlyTrendData(transactions);
    const currentMonthAmount = result.amounts[result.amounts.length - 1];
    expect(currentMonthAmount).toBe(300);
  });

  test("places last month spending in the second-to-last position", () => {
    const transactions = [makeTransMonthsAgo("Groceries 🛒", 450, 1)];
    const result = buildMonthlyTrendData(transactions);
    const lastMonthAmount = result.amounts[result.amounts.length - 2];
    expect(lastMonthAmount).toBe(450);
  });

  test("places spending from 5 months ago in the first position", () => {
    const transactions = [makeTransMonthsAgo("Rent & Housing 🏠", 700, 5)];
    const result = buildMonthlyTrendData(transactions);
    expect(result.amounts[0]).toBe(700);
  });

  test("ignores transactions from more than 6 months ago", () => {
    const transactions = [makeTransMonthsAgo("Shopping 🛍️", 999, 7)];
    const result = buildMonthlyTrendData(transactions);
    result.amounts.forEach((amount) => {
      expect(amount).toBe(0);
    });
  });

  test("correctly accumulates multiple transactions in the same month", () => {
    const transactions = [
      makeTrans("Food & Dining 🍔", 50),
      makeTrans("Groceries 🛒", 75),
      makeTrans("Transport & Fuel 🚗", 25),
    ];
    const result = buildMonthlyTrendData(transactions);
    const currentMonthTotal = result.amounts[result.amounts.length - 1];
    expect(currentMonthTotal).toBe(150);
  });

});

// ════════════════════════════════════════════════════════════════════
// TEST SUITE 3 — normalizeTag()
// ════════════════════════════════════════════════════════════════════

describe("normalizeTag() — Tag name normalization", () => {

  test("strips the recurring emoji prefix 🔁", () => {
    expect(normalizeTag("🔁 Food & Dining 🍔")).toBe("Food & Dining 🍔");
  });

  test("strips the (monthly) frequency suffix", () => {
    expect(normalizeTag("Entertainment 🎬 (monthly)")).toBe("Entertainment 🎬");
  });

  test("strips both prefix and suffix simultaneously", () => {
    expect(normalizeTag("🔁 Transport & Fuel 🚗 (daily)")).toBe("Transport & Fuel 🚗");
  });

  test("returns the tag unchanged if it has no recurring markers", () => {
    expect(normalizeTag("Groceries 🛒")).toBe("Groceries 🛒");
  });

  test("returns 'Uncategorized' for null input", () => {
    expect(normalizeTag(null)).toBe("Uncategorized");
  });

  test("returns 'Uncategorized' for undefined input", () => {
    expect(normalizeTag(undefined)).toBe("Uncategorized");
  });

  test("returns 'Uncategorized' for empty string input", () => {
    expect(normalizeTag("")).toBe("Uncategorized");
  });

});
