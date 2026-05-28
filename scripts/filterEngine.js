import { getAllTrans, getAllTags } from "./firebaseStore.js";

// Helper utility to normalize names from recurring entries (e.g., removing the 🔁 emoji)
function cleanTag(str) {
  if (!str) return "";
  return str
    .replace(/^🔁\s*/, "")
    .replace(/\s*\(.*\)$/, "")
    .trim();
}

/**
 * Executes multi-parameter search filtering across database transactions array
 * CLOUD MIGRATION: Upgraded to an async container to fetch data directly from Firestore collections
 */
export async function executeHistoryFilter() {
  // Await live cloud transaction ledger snapshot array
  const allTrans = (await getAllTrans()) || [];

  // Capture current parameter input values
  const keyword =
    document.getElementById("searchKeyword")?.value.toLowerCase().trim() || "";
  const selectedCat = document.getElementById("filterCategory")?.value || "all";
  const minPrice =
    Number(document.getElementById("filterMinPrice")?.value) || 0;
  const maxPrice =
    Number(document.getElementById("filterMaxPrice")?.value) || Infinity;
  const startDateStr = document.getElementById("filterStartDate")?.value;
  const endDateStr = document.getElementById("filterEndDate")?.value;

  // Convert dates to absolute timestamps for clean boundary matching
  const startTimestamp = startDateStr
    ? new Date(startDateStr + "T00:00:00").getTime()
    : 0;
  const endTimestamp = endDateStr
    ? new Date(endDateStr + "T23:59:59").getTime()
    : Infinity;

  // Run the multi-criteria filter stream
  return allTrans.filter((trans) => {
    // 1. Keyword search matches against item/vendor name OR raw tag text
    const targetName = (trans.name || "").toLowerCase();
    const targetTag = (trans.tag || "").toLowerCase();
    const matchesKeyword =
      keyword === "" ||
      targetName.includes(keyword) ||
      targetTag.includes(keyword);

    // 2. Category matching standard
    const matchesCategory =
      selectedCat === "all" || cleanTag(trans.tag) === selectedCat;

    // 3. Amount bounds checking (handles structural fallback if originalAmount is missing)
    const transAmount = trans.originalAmount || trans.amount;
    const matchesPrice =
      transAmount >= minPrice && (maxPrice === 0 || transAmount <= maxPrice);

    // 4. Time interval boundary checks
    const transTime = new Date(trans.time).getTime();
    const matchesDate =
      transTime >= startTimestamp && transTime <= endTimestamp;

    return matchesKeyword && matchesCategory && matchesPrice && matchesDate;
  });
}

/**
 * Refreshes options list inside dropdown search container menu with active system tags
 * CLOUD MIGRATION: Made async to dynamically fetch user tags from Firestore
 */
export async function populateFilterDropdown() {
  const dropdown = document.getElementById("filterCategory");
  if (!dropdown) return;

  const currentSelection = dropdown.value;
  dropdown.innerHTML = '<option value="all">All Categories</option>';

  // FIXED: Await your fallback-protected cloud tag collection list
  const tags = (await getAllTags()) || [];
  tags.forEach((tag) => {
    const cleaned = cleanTag(tag);
    dropdown.insertAdjacentHTML(
      "beforeend",
      `<option value="${cleaned}">${cleaned}</option>`,
    );
  });

  dropdown.value = currentSelection;
}
