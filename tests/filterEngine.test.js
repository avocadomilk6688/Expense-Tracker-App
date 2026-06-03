/**
 * Normalizes tag names by removing the 🔁 emoji and frequency blocks.
 * Replicated exactly from scripts/filterEngine.js
 */
function cleanTag(str) {
  if (!str) return "";
  return str
    .replace(/^🔁\s*/, "")
    .replace(/\s*\(.*\)$/, "")
    .trim();
}

/**
 * Executes a simulated multi-parameter search filter over an expense array dataset.
 * Isolates the logic parameters handled in scripts/filterEngine.js
 */
function executeMockHistoryFilter(allTrans, criteria) {
  const keyword = (criteria.keyword || "").toLowerCase().trim();
  const selectedCat = criteria.category || "all";
  const minPrice = criteria.minPrice || 0;
  const maxPrice = criteria.maxPrice || Infinity;
  const startTimestamp = criteria.startDate
    ? new Date(criteria.startDate + "T00:00:00").getTime()
    : 0;
  const endTimestamp = criteria.endDate
    ? new Date(criteria.endDate + "T23:59:59").getTime()
    : Infinity;

  return allTrans.filter((trans) => {
    // 1. Keyword search against item name or tag
    const targetName = (trans.name || "").toLowerCase();
    const targetTag = (trans.tag || "").toLowerCase();
    const matchesKeyword =
      keyword === "" ||
      targetName.includes(keyword) ||
      targetTag.includes(keyword);

    // 2. Category matching
    const matchesCategory =
      selectedCat === "all" || cleanTag(trans.tag) === selectedCat;

    // 3. Amount bounds checking
    const transAmount = trans.originalAmount || trans.amount;
    const matchesPrice = transAmount >= minPrice && transAmount <= maxPrice;

    // 4. Time interval boundary checks
    const transTime = new Date(trans.time).getTime();
    const matchesDate =
      transTime >= startTimestamp && transTime <= endTimestamp;

    return matchesKeyword && matchesCategory && matchesPrice && matchesDate;
  });
}

// =========================================================================
// JEST AUTOMATED UNIT TESTS
// =========================================================================

describe("Transaction History Search & Filter Interface Unit Tests", () => {
  // Mock dataset mimicking entries synced from Firestore user schema collections
  const mockTransactions = [
    {
      name: "Walmart Grocery Run",
      amount: 120,
      tag: "Groceries 🛒",
      time: "2026-06-01T10:00:00.000Z",
    },
    {
      name: "Netflix Subscription",
      amount: 15,
      tag: "🔁 Entertainment 🎬 (monthly)",
      time: "2026-06-02T14:30:00.000Z",
    },
    {
      name: "Starbucks Coffee",
      amount: 7,
      tag: "Food & Dining 🍔",
      time: "2026-06-02T08:15:00.000Z",
    },
    {
      name: "Shell Fuel Gas",
      amount: 55,
      tag: "Transport & Fuel 🚗",
      time: "2026-05-15T19:00:00.000Z",
    },
  ];

  // --- Filter Criterion 1: Fuzzy Text Keyword Searching ---
  describe("Keyword Text Search matching rules", () => {
    test("should find records when searching vendor names case-insensitively", () => {
      const criteria = { keyword: "wAlMaRt" };
      const results = executeMockHistoryFilter(mockTransactions, criteria);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("Walmart Grocery Run");
    });

    test("should cross-reference keyword searches against tag strings safely", () => {
      const criteria = { keyword: "Entertainment" };
      const results = executeMockHistoryFilter(mockTransactions, criteria);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("Netflix Subscription");
    });
  });

  // --- Filter Criterion 2: Category Dropdown Segregation ---
  describe("Category cleanTag() and filter segregation rules", () => {
    test("should parse and return items matching standard chosen dropdown strings", () => {
      const criteria = { category: "Food & Dining 🍔" };
      const results = executeMockHistoryFilter(mockTransactions, criteria);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("Starbucks Coffee");
    });

    test("should cleanly handle recurring tag strings to isolate the core category option matching value", () => {
      // Strips "🔁 Entertainment 🎬 (monthly)" -> "Entertainment 🎬" to match successfully
      const criteria = { category: "Entertainment 🎬" };
      const results = executeMockHistoryFilter(mockTransactions, criteria);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("Netflix Subscription");
    });
  });

  // --- Filter Criterion 3: Amount Bounds (Min / Max Prices) ---
  describe("Price boundary limit ranges rules", () => {
    test("should capture transactions falling accurately inside budget range slots", () => {
      const criteria = { minPrice: 10, maxPrice: 60 };
      const results = executeMockHistoryFilter(mockTransactions, criteria);
      // Should match Shell ($55) and Netflix ($15)
      expect(results.length).toBe(2);
      const names = results.map((r) => r.name);
      expect(names).toContain("Shell Fuel Gas");
      expect(names).toContain("Netflix Subscription");
    });
  });

  // --- Filter Criterion 4: Timeline Boundaries (Calendar Dates) ---
  describe("Calendar timeline boundary tracking rules", () => {
    test("should filter out items that do not fit inside specified date parameters range", () => {
      const criteria = { startDate: "2026-06-01", endDate: "2026-06-03" };
      const results = executeMockHistoryFilter(mockTransactions, criteria);
      // Excludes May 15 Shell purchase cleanly
      expect(results.length).toBe(3);
      expect(results.map((r) => r.name)).not.toContain("Shell Fuel Gas");
    });
  });
});
