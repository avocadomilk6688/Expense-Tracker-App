
/**
 * Helper function to normalize tag names by stripping out 
 * recurring emoji prefix and trailing frequency markers.
 */
function normalizeTagName(tagStr) {
  if (!tagStr) return "";
  let clean = tagStr.replace(/^🔁\s*/, "").trim();
  clean = clean.replace(/\s*\((daily|weekly|monthly)\)$/i, "").trim();
  return clean;
}

/**
 * Calculates the percentage ratio spent from a set limit.
 */
function calculateProgressBarPercentage(spent, limit) {
  if (!limit || limit <= 0) return "No Limit Set";
  const ratio = spent / limit;
  const percentage = Math.min(ratio * 100, 100);
  return `${Math.round(percentage)}%`;
}

/**
 * Determines the color profile of the budget progress bar element.
 * Targets the UX rule: ratio >= 85% turns Red (#F38181), otherwise Blue (#8b8dff).
 */
function getProgressBarColor(spent, limit) {
  if (!limit || limit <= 0) return "#8b8dff";
  const ratio = spent / limit;
  return ratio >= 0.85 ? "#F38181" : "#8b8dff";
}

// =========================================================================
// JEST AUTOMATED UNIT ASSERTIOMETRIC TESTS
// =========================================================================

describe("Monthly Category Limits & Structure Unit Tests", () => {
  // --- Feature Implementation: Dynamic Default Categories Formatting ---
  describe("normalizeTagName() - Tag Sanitation String Rules", () => {
    test("should cleanly strip out recurring emoji identifier", () => {
      expect(normalizeTagName("🔁 Food & Dining 🍔")).toBe("Food & Dining 🍔");
    });

    test("should wipe away trailing timeline frequency flags", () => {
      expect(normalizeTagName("Entertainment 🎬 (monthly)")).toBe(
        "Entertainment 🎬",
      );
      expect(normalizeTagName("🔁 Transport 🚗 (daily)")).toBe("Transport 🚗");
    });

    test("should return an empty string fallback when processing null or undefined inputs", () => {
      expect(normalizeTagName(null)).toBe("");
      expect(normalizeTagName(undefined)).toBe("");
    });
  });

  // --- Feature Implementation: Monthly Spending Limit Progress Calculation ---
  describe("calculateProgressBarPercentage() - Arithmetic Operations", () => {
    test("should compute correct percentage strings for standard active balances", () => {
      expect(calculateProgressBarPercentage(50, 200)).toBe("25%");
      expect(calculateProgressBarPercentage(75, 100)).toBe("75%");
    });

    test("should forcefully clamp metrics to 100% if expenses overrun allocated limits", () => {
      // Prevents UI progress bars from breaking out of the container bounds visually
      expect(calculateProgressBarPercentage(120, 100)).toBe("100%");
      expect(calculateProgressBarPercentage(300, 150)).toBe("100%");
    });

    test("should return 'No Limit Set' string if category budget limits are undefined or zero", () => {
      expect(calculateProgressBarPercentage(40, 0)).toBe("No Limit Set");
      expect(calculateProgressBarPercentage(40, null)).toBe("No Limit Set");
    });
  });

  // --- Feature Implementation: Real-time Budget Limit Status Alert Warnings ---
  describe("getProgressBarColor() - Dynamic UI Color Triggers", () => {
    test("should output standard safe purple-blue hex flag if budget consumption is below 85%", () => {
      expect(getProgressBarColor(50, 100)).toBe("#8b8dff");
    });

    test("should switch output instantly to emergency crimson red when budget breaches warning limit (>= 85%)", () => {
      expect(getProgressBarColor(85, 100)).toBe("#F38181");
      expect(getProgressBarColor(95, 100)).toBe("#F38181");
    });
  });
});
