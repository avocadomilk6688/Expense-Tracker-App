import { fromBaseINR, SUPPORTED_CURRENCIES } from "./currencyService.js";
import {
  getCategoryLimit,
  setCategoryLimit,
  getAllTrans,
  auth,
} from "./firebaseStore.js";

/**
 * Helper function to normalize tag names by stripping out your teammate's
 * recurring emoji prefix and trailing frequency markers (e.g., "🔁 Food (monthly)" -> "Food")
 */
function normalizeTagName(tagStr) {
  if (!tagStr) return "";
  let clean = tagStr.replace(/^🔁\s*/, "").trim();
  clean = clean.replace(/\s*\((daily|weekly|monthly)\)$/i, "").trim();
  return clean;
}

/**
 * Calculate the total spent for a specific category tag
 * CLOUD MIGRATION: Reads records directly from Firestore user sub-collections instead of localStorage cache
 */
export async function getCategorySpent(categoryName) {
  // Await live cloud transaction ledger snapshot array
  const allTrans = (await getAllTrans()) || [];

  const now = new Date();
  const currentMonth = now.getMonth(); // 0 = January, 1 = February, etc.
  const currentYear = now.getFullYear();

  return allTrans
    .filter((trans) => {
      // Match the category tag name first
      const isMatch = normalizeTagName(trans.tag) === categoryName;

      // Parse the transaction timestamp
      const transDate = new Date(trans.time);

      // Verify the transaction falls within the current calendar month
      const isThisMonth =
        transDate.getMonth() === currentMonth &&
        transDate.getFullYear() === currentYear;

      return isMatch && isThisMonth;
    })
    .reduce((sum, trans) => sum + trans.amount, 0);
}

/**
 * Dynamically builds and updates the Category Budgets UI dashboard tracking bars
 */
export async function updateCategoryProgressBars() {
  const container = document.getElementById("categoryProgressContainer");
  if (!container) return;

  // CLOUD MIGRATION: Read active currency preference state parameters directly from running cloud cache
  const displayCurrency = getCategoryLimit
    ? await import("./firebaseStore.js").then((m) => m.getDisplayCurrency())
    : "INR";
  const sym =
    SUPPORTED_CURRENCIES.find((c) => c.code === displayCurrency)?.symbol ?? "₹";

  // 1. Fetch baseline formal tags from your teammate's tracker array, cleaned uniformly
  const formalTags = (
    getCategoryLimit
      ? await import("./firebaseStore.js").then((m) => m.getAllTags())
      : []
  ).map((t) => normalizeTagName(t));

  // 2. CLOUD MIGRATION: Scan live cloud transaction records to discover newly appended tracking items
  const allTrans = (await getAllTrans()) || [];
  const activeTransTags = allTrans
    .map((t) => normalizeTagName(t.tag))
    .filter((tag) => tag !== "");

  // 3. De-duplicate values completely using a Set structure
  const combinedTagsSet = new Set([...formalTags, ...activeTransTags]);
  const tagArray = Array.from(combinedTagsSet);

  if (tagArray.length === 0) {
    container.innerHTML = `<p style="font-size:0.9rem; color:#614a4a; padding:10px; text-align:center;">Please create tags in the Expense tab first.</p>`;
    return;
  }

  // Initialize an empty string buffer to hold the elements
  let htmlBuffer = "";

  // Generate a live tracking bar card row for every tag found
  for (const tag of tagArray) {
    // CLOUD MIGRATION: Pulls specific category limits downward directly from Firebase configurations profile document
    const currentLimitBase = Number(getCategoryLimit(tag)) || 0;
    const currentSpentBase = await getCategorySpent(tag);

    const [dispLimit, dispSpent] = await Promise.all([
      fromBaseINR(currentLimitBase, displayCurrency),
      fromBaseINR(currentSpentBase, displayCurrency),
    ]);

    const roundedLimit = Math.round(dispLimit);
    const roundedSpent = Math.round(dispSpent);

    const ratio =
      currentLimitBase > 0 ? currentSpentBase / currentLimitBase : 0;
    const percentage = Math.min(ratio * 100, 100);

    const barColor = ratio >= 0.85 ? "#F38181" : "#8b8dff";

    const cleanTagId = tag.replace(/\s+/g, "-");

    // Append components directly into memory buffer
    htmlBuffer += `
      <div class="category-limit-item" data-tagbase="${currentSpentBase}" style="background: #fdfdfd; padding: 12px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #eee;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 600; font-size: 0.95rem; color: #333;">${tag}</span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 0.8rem; color: #777;">Limit: ${sym}</span>
            <input type="number" class="limit-input-field" data-tag="${tag}" value="${roundedLimit || ""}" placeholder="Set limit" 
              style="width: 80px; padding: 4px; font-size: 0.85rem; border: 1px solid #ccc; border-radius: 4px; text-align: center;">
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #555; margin-bottom: 4px;">
          <span>Spent: ${sym}${roundedSpent}</span>
          <span id="percent-text-${cleanTagId}">${roundedLimit > 0 ? Math.round(percentage) + "%" : "No Limit Set"}</span>
        </div>

        <div style="background-color: #eef2f3; height: 8px; border-radius: 10px; overflow: hidden; width: 100%;">
          <div id="bar-fill-${cleanTagId}" style="height: 100%; background-color: ${barColor}; width: ${percentage}%; border-radius: 10px; transition: all 0.3s ease;"></div>
        </div>
      </div>
    `;
  }

  container.innerHTML = htmlBuffer;

  // Listens to real-time input typing to save and shift sizes seamlessly WITHOUT breaking page focus
  container.querySelectorAll(".limit-input-field").forEach((input) => {
    input.addEventListener("input", async (e) => {
      const targetTag = e.target.dataset.tag;
      const targetValue = Number(e.target.value);
      const cleanTagId = targetTag.replace(/\s+/g, "-");

      const itemRow = e.target.closest(".category-limit-item");
      const barFill = document.getElementById(`bar-fill-${cleanTagId}`);
      const percentText = document.getElementById(`percent-text-${cleanTagId}`);

      const currentSpentBase = Number(itemRow.dataset.tagbase);

      const { toBaseINR } = await import("./currencyService.js");
      const baseValue = await toBaseINR(targetValue, displayCurrency);
      const currentLimitBase = Math.round(baseValue);

      // CLOUD MIGRATION: Commits target value changes dynamically directly up to your Firestore cluster document nodes!
      await setCategoryLimit(targetTag, currentLimitBase);

      if (currentLimitBase > 0) {
        const ratio = currentSpentBase / currentLimitBase;
        const percentage = Math.min(ratio * 100, 100);
        const barColor = ratio >= 0.85 ? "#F38181" : "#8b8dff";

        if (barFill) {
          barFill.style.width = `${percentage}%`;
          barFill.style.backgroundColor = barColor;
        }
        if (percentText) {
          percentText.textContent = `${Math.round(percentage)}%`;
        }
      } else {
        if (barFill) barFill.style.width = "0%";
        if (percentText) percentText.textContent = "No Limit Set";
      }
    });
  });
}
