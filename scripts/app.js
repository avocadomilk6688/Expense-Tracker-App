import localStorage from "./localStorage.js";
import {
  toBaseINR,
  fromBaseINR, // ← ADD THIS
  SUPPORTED_CURRENCIES,
  BASE_CURRENCY,
  formatWithOriginal,
} from "./currencyService.js";
import {
  processDue,
  getAllRecurring,
  saveRecurring,
  deleteRecurring,
  createRecurringItemHTML,
} from "./recurringEngine.js";
import { updateCategoryProgressBars } from "./categoryEngine.js";

// ─────────────────────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────────────────────
const colors = {
  red: "#F38181",
  green: "#297054b0",
  yellow: "#FCE38A",
  purple: "#8b8dff",
  lightBlue: "#d2dfff",
};

let totalExpData, totalBudgetLeftData;
let currentTab = "expense";

// ─────────────────────────────────────────────────────────────
// ELEMENT REFERENCES
// ─────────────────────────────────────────────────────────────
const ctx = document.getElementById("myChart");
const budgetLeftEle = document.getElementById("budgetLeft");
const totalBudgetEle = document.getElementById("totalBudget");
const totalExpEle = document.getElementById("totalExp");
const addExpBtnEle = document.querySelector(".add-exp-btn");
const addBudBtnEle = document.querySelector(".add-bud-btn");
const expForSelectEle = document.querySelector(".exp-for");
const tagContainer = document.querySelector(".tags-conatiner");
let allOptionLabel = document.querySelectorAll(".tags-conatiner label");
const addBtnEle = document.getElementById("addBtn");
const clearBtnEle = document.getElementById("clearBtn");
const transAmountEle = document.getElementById("addAmount");
const expForEle = document.querySelectorAll('[name="expFor"]');
const transHistoryParentEle = document.querySelector(
  ".money-history-container",
);
const mobileAddScreenShowBtn = document.querySelector(".mobile-add-btn");
const moneyAddCardEle = document.querySelector(".add-money-card");
const addNewTagBtnEle = document.getElementById("addTagBtn");
const confirmTagBtnEle = document.getElementById("confirmNewTag");
const tagInputEle = document.querySelector(".tag-input");
const tagInputField = document.getElementById("tagInputField");
const sortTransSelectEle = document.getElementById("sortTrans");
const editCardEle = document.querySelector(".edit-money-card");
const editAmountEle = document.getElementById("editAmount");
const editTagEle = document.getElementById("tagName");
const editTranBtn = document.getElementById("editTranBtn");
const closeEditCardBtn = document.getElementById("closeEdit");
const addAmountCardInfo = document.querySelector(".add-money-card .info");
const editCardInfo = document.querySelector(".edit-money-card .info");
const editBudgetBtn = document.getElementById("editBudgetBtn");
const sortRecurringEle = document.getElementById("sortRecurring");
const currencySelectEle = document.getElementById("currencySelect");
const recurringRowEle = document.getElementById("recurringRow");
const isRecurringCheckbox = document.getElementById("isRecurring");
const recurringFreqEle = document.getElementById("recurringFreq");
const recurringListEle = document.querySelector(".recurring-list");
const recTabBtnEle = document.getElementById("recTabBtn");

// ─────────────────────────────────────────────────────────────
// INFO MESSAGES
// ─────────────────────────────────────────────────────────────
function showInfo(ele, txt = "") {
  ele.parentElement.style.display = "flex";
  ele.textContent = txt;
}

function hideInfo(ele) {
  ele.textContent = "";
  ele.parentElement.style.display = "none";
}

// ─────────────────────────────────────────────────────────────
// BUDGET CALCULATIONS
// ─────────────────────────────────────────────────────────────

async function totalCalculate() {
  const allTrans = localStorage.getAllTrans();
  const displayCurrency = localStorage.getDisplayCurrency();
  const sym =
    SUPPORTED_CURRENCIES.find((c) => c.code === displayCurrency)?.symbol ?? "₹";

  let total = 0;
  for (let i = 0; i < allTrans.length; i++) {
    total += allTrans[i].amount;
  }

  const budget = Number(localStorage.getTotalBudget());
  const leftBudget = budget - total;
  totalExpData = total;
  totalBudgetLeftData = leftBudget;

  // Convert to display currency
  const [dispTotal, dispBudget, dispLeft] = await Promise.all([
    fromBaseINR(total, displayCurrency),
    fromBaseINR(budget, displayCurrency),
    fromBaseINR(leftBudget, displayCurrency),
  ]);

  totalExpEle.textContent = `${Math.round(dispTotal)}`;
  budgetLeftEle.textContent = `${Math.round(dispLeft)}`;
  totalBudgetEle.textContent = `${Math.round(dispBudget)}`;

  // Update the ₹ symbol in the HTML to match display currency
  document
    .querySelectorAll(".money-left-card h1, .total-card h4")
    .forEach((el) => {});
  swapCurrencySymbols(sym);

  if (typeof updateCategoryProgressBars === "function")
    updateCategoryProgressBars();
}

function swapCurrencySymbols(sym) {
  // Replace the hardcoded ₹ before each span
  ["budgetLeft", "totalBudget", "totalExp"].forEach((id) => {
    const span = document.getElementById(id);
    if (span?.previousSibling?.nodeType === 3) {
      span.previousSibling.textContent = sym;
    }
  });
}

// ─────────────────────────────────────────────────────────────
// BUDGET INPUT (async — reads from shared currencySelectEle)
// ─────────────────────────────────────────────────────────────
async function addBudgetInput() {
  const amount = transAmountEle.value;
  const currency = currencySelectEle?.value ?? BASE_CURRENCY;

  if (amount == "") {
    showInfo(addAmountCardInfo, "Please enter budget amount.");
    return;
  }

  const baseAmount = await toBaseINR(Number(amount), currency);
  localStorage.setTotalBudget(Math.round(baseAmount));
  localStorage.setBudgetMeta(currency, Number(amount));
  totalCalculate();
  hideInfo(addAmountCardInfo);
}

// ─────────────────────────────────────────────────────────────
// TAB SWITCHING — expense vs budget vs category limits
// ─────────────────────────────────────────────────────────────
const showBudgetInput = () => {
  currentTab = "budget";
  addExpBtnEle.classList.remove("selected-add-exp");
  addBudBtnEle.classList.add("selected-add-bud");

  // Reset Category Limit button style state back to clear unselected
  const catBtn = document.getElementById("categoryBudgetsTabBtn");
  if (catBtn) {
    catBtn.style.backgroundColor = "";
    catBtn.style.color = "";
  }

  // Erase our block overrides and let the browser native CSS rules control the layout
  const formContainer = document.querySelector(".form-container");
  if (formContainer) formContainer.style.display = "";

  // Explicitly restore visibility of your clean input targets
  const amountDiv = document.querySelector(".add-amount");
  if (amountDiv) amountDiv.style.display = "";
  const currencyDiv = document.querySelector(".select-currency");
  if (currencyDiv) currencyDiv.style.display = "";

  expForSelectEle.style.display = "none";
  if (recurringRowEle) recurringRowEle.style.display = "none";

  if (document.getElementById("categoryBudgetsContainerBlock"))
    document.getElementById("categoryBudgetsContainerBlock").style.display =
      "none";

  // FIXED: Erase inline display overrides so your teammate's CSS handles button alignment perfectly
  const actionButtons = document.querySelector(".add-money-card-btn");
  if (actionButtons) actionButtons.style.display = "";

  const { currency, originalAmount } = localStorage.getBudgetMeta();
  transAmountEle.value = originalAmount || localStorage.getTotalBudget();
  if (currencySelectEle) currencySelectEle.value = currency ?? BASE_CURRENCY;
  addBtnEle.innerHTML = `Save <i class="fa-solid fa-check"></i>`;
  addBtnEle.removeEventListener("click", addTransItem);
  addBtnEle.addEventListener("click", addBudgetInput);
};

const showExpInput = () => {
  currentTab = "expense";
  addBudBtnEle.classList.remove("selected-add-bud");
  addExpBtnEle.classList.add("selected-add-exp");

  // Reset Category Limit button style state back to clear unselected
  const catBtn = document.getElementById("categoryBudgetsTabBtn");
  if (catBtn) {
    catBtn.style.backgroundColor = "";
    catBtn.style.color = "";
  }

  // Erase our block overrides and let the browser native CSS rules control the layout
  const formContainer = document.querySelector(".form-container");
  if (formContainer) formContainer.style.display = "";

  // Explicitly restore visibility of your clean input targets
  const amountDiv = document.querySelector(".add-amount");
  if (amountDiv) amountDiv.style.display = "";
  const currencyDiv = document.querySelector(".select-currency");
  if (currencyDiv) currencyDiv.style.display = "";

  expForSelectEle.style.display = "";
  if (recurringRowEle) recurringRowEle.style.display = "";

  if (document.getElementById("categoryBudgetsContainerBlock"))
    document.getElementById("categoryBudgetsContainerBlock").style.display =
      "none";

  // FIXED: Erase inline display overrides so your teammate's CSS handles button alignment perfectly
  const actionButtons = document.querySelector(".add-money-card-btn");
  if (actionButtons) actionButtons.style.display = "";

  transAmountEle.value = "";
  if (currencySelectEle) currencySelectEle.value = BASE_CURRENCY;

  addBtnEle.innerHTML = `Add <i class="fa-solid fa-plus"></i>`;
  addBtnEle.removeEventListener("click", addBudgetInput);
  addBtnEle.addEventListener("click", addTransItem);
};

const showCategoryProgressInputTab = () => {
  currentTab = "categories";

  addExpBtnEle.classList.remove("selected-add-exp");
  addBudBtnEle.classList.remove("selected-add-bud");

  // Force visual highlight change on the Category Limit button manually
  const catBtn = document.getElementById("categoryBudgetsTabBtn");
  if (catBtn) {
    catBtn.style.backgroundColor = "#8b8dff";
  }

  // Explicitly hide your clean targets here
  const amountDiv = document.querySelector(".add-amount");
  if (amountDiv) amountDiv.style.display = "none";
  const currencyDiv = document.querySelector(".select-currency");
  if (currencyDiv) currencyDiv.style.display = "none";

  // Turn off the parent core form container wrapper
  const formContainer = document.querySelector(".form-container");
  if (formContainer) formContainer.style.display = "none";

  // Hide the add/clear actions buttons row completely on the limits tab view
  const actionButtons = document.querySelector(".add-money-card-btn");
  if (actionButtons) actionButtons.style.display = "none";

  // Exclusively reveal your custom dashboard block containing the limits tracking bars
  if (document.getElementById("categoryBudgetsContainerBlock"))
    document.getElementById("categoryBudgetsContainerBlock").style.display =
      "block";

  if (typeof updateCategoryProgressBars === "function")
    updateCategoryProgressBars();
};
// ─────────────────────────────────────────────────────────────
// TRANSACTION HTML
// ─────────────────────────────────────────────────────────────
function createTranHTML(obj = {}) {
  const displayCurrency = localStorage.getDisplayCurrency();
  const sym =
    SUPPORTED_CURRENCIES.find((c) => c.code === displayCurrency)?.symbol ?? "₹";
  const domId = `tran-amount-${obj.id}`;

  const hasBracket =
    obj.currency && obj.currency !== displayCurrency && obj.originalAmount;
  const origSym = hasBracket
    ? (SUPPORTED_CURRENCIES.find((c) => c.code === obj.currency)?.symbol ??
      obj.currency)
    : "";
  const bracketHtml = hasBracket
    ? ` <span class="approx-inr">(${origSym}${obj.originalAmount})</span>`
    : "";

  fromBaseINR(obj.amount, displayCurrency).then((converted) => {
    const el = document.getElementById(domId);
    if (el) el.innerHTML = `-${sym}${Math.round(converted)}${bracketHtml}`;
  });

  return `<div class="trans-item" id="${obj?.id}">
  <div>
      <h4 class="trans-amount" id="${domId}">-${sym}...</h4>
      <div class="tranTagContainer">
        <p>${obj?.tag}</p>
        <p class="trans-date">${new Date(obj?.time).toLocaleString()}</p>
      </div>
  </div>
  <p class="trans-date">${new Date(obj?.time).toLocaleString()}</p>
  <div class="trans-item-btn">
      <button id="transEdit"><i class="fa-regular fa-pen-to-square"></i></button>
      <button id="transDelete"><i class="fa-regular fa-trash-can"></i></button>
  </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// TAGS
// ─────────────────────────────────────────────────────────────
function createTagHTML(str) {
  return `
  <input type="radio" id="${str}" name="expFor" value="${str}">
  <label for="${str}">${str}</label>
  `;
}

function renderTags() {
  tagContainer.innerHTML = "";
  const tagArray = localStorage.getAllTags();
  if (tagArray == []) return;

  tagArray.forEach((tag) => {
    tagContainer.insertAdjacentHTML("afterbegin", createTagHTML(tag));
  });

  allOptionLabel = document.querySelectorAll(".exp-for label");
  allOptionLabel.forEach((label) => {
    label.addEventListener("click", () => {
      allOptionLabel.forEach((l) => {
        l.style.backgroundColor = colors.lightBlue;
      });
      label.style.backgroundColor = colors.yellow;
    });
  });
}

renderTags();

function addNewTag() {
  const tagValue = tagInputField.value;
  if (tagValue != "") {
    localStorage.saveTag(tagValue);
    renderTags();
  }
  tagInputField.value = "";
  tagInputEle.classList.remove("show");
}

// ─────────────────────────────────────────────────────────────
// TRANSACTION HISTORY RENDER
// ─────────────────────────────────────────────────────────────
function renderTransHistory(transArr = []) {
  transHistoryParentEle.innerHTML = "";
  if (transArr == []) return;

  transArr.forEach((transObj) => {
    transHistoryParentEle.insertAdjacentHTML(
      "beforeend",
      createTranHTML(transObj),
    );
  });
}

renderTransHistory(localStorage.getAllTrans());

// ─────────────────────────────────────────────────────────────
// CHART
// ─────────────────────────────────────────────────────────────
function showChart(arr = []) {
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Expence", "Buget Left"],
      datasets: [
        {
          data: arr,
          backgroundColor: [colors.red, colors.green],
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function findCheckedTag(arr) {
  let checkedTag = undefined;
  arr.forEach((tag) => {
    if (tag.checked) checkedTag = tag;
  });
  return checkedTag;
}

function clearCheckedTag(checkedTag) {
  if (!checkedTag) return;
  checkedTag.checked = false;
  const label = document.querySelector(`[for="${checkedTag.id}"]`);
  if (label) label.style.backgroundColor = colors.lightBlue;
}

// ─────────────────────────────────────────────────────────────
// ADD TRANSACTION (async — multicurrency + recurring)
// ─────────────────────────────────────────────────────────────
async function addTransItem() {
  const amountEle = document.getElementById("addAmount");
  const checkedTag = findCheckedTag(
    Array.from(document.querySelectorAll('[name="expFor"]')),
  );
  const amount = amountEle.value;
  const currency = currencySelectEle?.value ?? BASE_CURRENCY;
  const checkedTagValue = checkedTag ? checkedTag.value : undefined;

  // Validation
  if (!amount || Number(amount) <= 0) {
    showInfo(addAmountCardInfo, "Please enter proper amount.");
    return;
  }
  if (!checkedTagValue) {
    showInfo(addAmountCardInfo, "Please select a tag.");
    return;
  }

  const baseAmount = await toBaseINR(Number(amount), currency);

  if (isRecurringCheckbox?.checked) {
    // ── Save as a recurring template ──────────────────────────
    const rec = {
      id: Math.floor(Math.random() * 10_000_000),
      amount: Number(amount),
      currency,
      tag: checkedTagValue,
      frequency: recurringFreqEle?.value ?? "monthly",
      lastRun: null,
    };
    saveRecurring(rec);
    renderRecurringList();

    // Fire first occurrence right now
    localStorage.saveTrans({
      id: Math.floor(Math.random() * 10_000_000),
      amount: Math.round(baseAmount),
      originalAmount: Number(amount),
      currency,
      tag: `🔁 ${checkedTagValue} (${rec.frequency})`,
      time: new Date().toISOString(),
    });

    // Mark lastRun so engine doesn't double-fire on next app load
    rec.lastRun = new Date().toISOString();
    saveRecurring(rec);

    showInfo(
      addAmountCardInfo,
      `✅ Recurring (${rec.frequency}) saved & first charge added.`,
    );
  } else {
    // ── One-time transaction ──────────────────────────────────
    localStorage.saveTrans({
      id: Math.floor(Math.random() * 10_000_000),
      amount: Math.round(baseAmount),
      originalAmount: Number(amount),
      currency,
      tag: checkedTagValue,
      time: new Date().toISOString(),
    });
    hideInfo(addAmountCardInfo);
  }

  renderTransHistory(localStorage.getAllTrans());
  addTranBtnEvent();
  totalCalculate();

  // Reset form
  amountEle.value = "";
  clearCheckedTag(checkedTag);
  if (isRecurringCheckbox) isRecurringCheckbox.checked = false;
  if (recurringFreqEle) recurringFreqEle.style.display = "none";
}

// ─────────────────────────────────────────────────────────────
// CLEAR FORM
// ─────────────────────────────────────────────────────────────
function clearInputForm() {
  transAmountEle.value = "";
  Array.from(document.querySelectorAll('[name="expFor"]')).forEach((input) => {
    input.checked = false;
  });
  document.querySelectorAll(".tags-conatiner label").forEach((label) => {
    label.style.backgroundColor = `${colors.lightBlue}`;
  });
  if (isRecurringCheckbox) isRecurringCheckbox.checked = false;
  if (recurringFreqEle) recurringFreqEle.style.display = "none";
  hideInfo(addAmountCardInfo);
}

// ─────────────────────────────────────────────────────────────
// TRANSACTION BUTTON EVENTS (edit / delete)
// ─────────────────────────────────────────────────────────────
function addTranBtnEvent() {
  document.querySelectorAll(".trans-item").forEach((item) => {
    // Delete button
    item.lastElementChild.lastElementChild.addEventListener("click", () => {
      const sure = window.confirm("Are you really wanna delete this?");
      if (sure) {
        localStorage.deleteTrans(item.id);
        renderTransHistory(localStorage.getAllTrans());
        addTranBtnEvent();
        totalCalculate();
      }
    });

    // Edit button
    item.lastElementChild.firstElementChild.addEventListener("click", () => {
      const tranObj = localStorage.findTran(item.id);
      editCardEle.style.display = "flex";
      editTagEle.value = tranObj?.tag;
      editCardEle.id = tranObj?.id;
      editAmountEle.value = tranObj?.originalAmount ?? tranObj?.amount;
      editCardEle.dataset.currency = tranObj?.currency ?? BASE_CURRENCY;
      const sym =
        SUPPORTED_CURRENCIES.find(
          (c) => c.code === (tranObj?.currency ?? BASE_CURRENCY),
        )?.symbol ?? "";
      const label = document.getElementById("editCurrencyLabel");
      if (label)
        label.textContent = `(${sym} ${tranObj?.currency ?? BASE_CURRENCY})`;
      const editFreqRow = document.getElementById("editFreqRow");
      const editFreqSel = document.getElementById("editFreq");
      const isRec = tranObj?.tag?.startsWith("🔁");
      if (editFreqRow) editFreqRow.style.display = isRec ? "flex" : "none";
      if (isRec && editFreqSel) {
        const match = tranObj.tag.match(/\((\w+)\)$/);
        if (match) editFreqSel.value = match[1];
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────
// EDIT TRANSACTION
// ─────────────────────────────────────────────────────────────
async function editTran() {
  if (
    editAmountEle.value != "" &&
    Number(editAmountEle.value) > 0 &&
    editTagEle.value != ""
  ) {
    const editCurrency = editCardEle.dataset.currency ?? BASE_CURRENCY;
    const baseAmount = await toBaseINR(
      Number(editAmountEle.value),
      editCurrency,
    );
    const editFreqSel = document.getElementById("editFreq");
    const editFreqRow = document.getElementById("editFreqRow");
    const isRec = editTagEle.value?.startsWith("🔁");
    const newFreq = isRec && editFreqSel ? editFreqSel.value : null;
    const transObj = {
      id: Number(editCardEle.id),
      amount: Math.round(baseAmount),
      originalAmount: Number(editAmountEle.value),
      currency: editCurrency,
      tag: newFreq
        ? editTagEle.value.replace(/\s*\(.*\)$/, "") + ` (${newFreq})`
        : editTagEle.value,
    };
    localStorage.saveTrans(transObj);
    const isRecurringFilter =
      transHistoryParentEle.dataset.filter === "recurring";
    if (isRecurringFilter) {
      const recurringOnly = localStorage
        .getAllTrans()
        .filter((t) => t.tag?.startsWith("🔁"));
      renderTransHistory(recurringOnly);
    } else {
      renderTransHistory(localStorage.getAllTrans());
    }
    addTranBtnEvent();
    totalCalculate();
    editAmountEle.value = "";
    editTagEle.value = "";
    hideInfo(editCardInfo);
  } else {
    showInfo(editCardInfo, "Please enter proper value.");
  }

  editCardEle.style.display = "none";
}

// ─────────────────────────────────────────────────────────────
// SORT TRANSACTIONS
// ─────────────────────────────────────────────────────────────
const sortTransHelper = (arr = [], sortTypeNum) => {
  return arr.sort((a, b) => {
    if (a.amount > b.amount) return sortTypeNum === 1 ? -1 : 1;
    if (a.amount < b.amount) return sortTypeNum === 1 ? 1 : -1;
    return 0;
  });
};

function sortTrans(e) {
  const sortType = e.target.value;
  switch (sortType) {
    case "highToLow":
      renderTransHistory(sortTransHelper(localStorage.getAllTrans(), 1));
      addTranBtnEvent();
      break;
    case "lowToHigh":
      renderTransHistory(sortTransHelper(localStorage.getAllTrans(), -1));
      addTranBtnEvent();
      break;
    default:
      renderTransHistory(localStorage.getAllTrans());
      addTranBtnEvent();
      break;
  }
}

// ─────────────────────────────────────────────────────────────
// CURRENCY SELECT — one dropdown, shared by both tabs
// ─────────────────────────────────────────────────────────────
function initCurrencySelect() {
  if (!currencySelectEle) return;
  currencySelectEle.innerHTML = SUPPORTED_CURRENCIES.map(
    (c) => `<option value="${c.code}">${c.symbol} ${c.code}</option>`,
  ).join("");
}

// ─────────────────────────────────────────────────────────────
// RECURRING LIST RENDER
// ─────────────────────────────────────────────────────────────
function renderRecurringList() {
  if (!recurringListEle) return;
  const all = getAllRecurring();

  recurringListEle.innerHTML = all.length
    ? all.map(createRecurringItemHTML).join("")
    : `<p class="no-recurring">No recurring expenses yet.</p>`;

  recurringListEle.querySelectorAll(".del-rec-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (confirm("Delete this recurring expense?")) {
        deleteRecurring(Number(btn.dataset.id));
        renderRecurringList();
      }
    });
  });

  recurringListEle.querySelectorAll(".edit-rec-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const newAmount = prompt(
        `Edit amount (${btn.dataset.currency}):`,
        btn.dataset.amount,
      );
      if (newAmount && Number(newAmount) > 0) {
        const rec = getAllRecurring().find(
          (r) => r.id === Number(btn.dataset.id),
        );
        if (rec) {
          rec.amount = Number(newAmount);
          saveRecurring(rec);
          renderRecurringList();
        }
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────────────────────
mobileAddScreenShowBtn.addEventListener("click", () => {
  moneyAddCardEle.classList.toggle("show");
  mobileAddScreenShowBtn.children[0].classList.toggle("rotatePlus");
});

closeEditCardBtn.addEventListener("click", () => {
  editCardEle.style.display = "none";
  hideInfo(editCardInfo);
});

editBudgetBtn?.addEventListener("click", () => {
  showBudgetInput(); // switch to budget tab
  moneyAddCardEle.classList.add("show"); // open card on mobile
  transAmountEle.focus(); // jump cursor to amount field
});

editTranBtn.addEventListener("click", editTran);
addBudBtnEle.addEventListener("click", showBudgetInput);
addExpBtnEle.addEventListener("click", showExpInput);
document
  .getElementById("categoryBudgetsTabBtn")
  ?.addEventListener("click", showCategoryProgressInputTab);
addBtnEle.addEventListener("click", addTransItem);
clearBtnEle.addEventListener("click", clearInputForm);

addNewTagBtnEle.addEventListener("click", () => {
  tagInputEle.classList.toggle("show");
});

confirmTagBtnEle.addEventListener("click", addNewTag);
sortTransSelectEle.addEventListener("change", sortTrans);

// Show/hide frequency dropdown when recurring checkbox is toggled
isRecurringCheckbox?.addEventListener("change", () => {
  if (recurringFreqEle) {
    recurringFreqEle.style.display = isRecurringCheckbox.checked
      ? "inline-block"
      : "none";
  }
});

recTabBtnEle?.addEventListener("click", () => {
  const isShowingRecurring =
    transHistoryParentEle.dataset.filter === "recurring";

  if (isShowingRecurring) {
    // Exit filter — show all
    transHistoryParentEle.dataset.filter = "";
    renderTransHistory(localStorage.getAllTrans());
    addTranBtnEvent();
    recTabBtnEle.innerHTML = `🔁 Recurring <i class="fa-solid fa-chevron-down"></i>`;
    recurringListEle?.classList.remove("show");
    sortTransSelectEle.style.display = "";
    if (sortRecurringEle) sortRecurringEle.style.display = "none";
  } else {
    // Enter filter — show only recurring
    transHistoryParentEle.dataset.filter = "recurring";
    const recurringOnly = localStorage
      .getAllTrans()
      .filter((t) => t.tag?.startsWith("🔁"));
    renderTransHistory(recurringOnly);
    addTranBtnEvent();
    recTabBtnEle.innerHTML = `✕ Exit Recurring`;
    renderRecurringList();
    recurringListEle?.classList.add("show");
    sortTransSelectEle.style.display = "none";
    if (sortRecurringEle) sortRecurringEle.style.display = "";
  }
});

sortRecurringEle?.addEventListener("change", (e) => {
  const recurringOnly = localStorage
    .getAllTrans()
    .filter((t) => t.tag?.startsWith("🔁"));
  const sortType = e.target.value;
  const sorted =
    sortType === "highToLow"
      ? sortTransHelper(recurringOnly, 1)
      : sortType === "lowToHigh"
        ? sortTransHelper(recurringOnly, -1)
        : recurringOnly;
  renderTransHistory(sorted);
  addTranBtnEvent();
});

// ─────────────────────────────────────────────────────────────
// INITIAL RENDER
// ─────────────────────────────────────────────────────────────
addTranBtnEvent();

// ─────────────────────────────────────────────────────────────
// INIT — async startup tasks
// ─────────────────────────────────────────────────────────────
async function init() {
  initCurrencySelect();
  renderRecurringList();

  // Populate display currency dropdown
  const displaySelect = document.getElementById("displayCurrencySelect");
  if (displaySelect) {
    displaySelect.innerHTML = SUPPORTED_CURRENCIES.map(
      (c) => `<option value="${c.code}">${c.symbol} ${c.code}</option>`,
    ).join("");
    displaySelect.value = localStorage.getDisplayCurrency();

    displaySelect.addEventListener("change", async () => {
      localStorage.setDisplayCurrency(displaySelect.value);
      renderTransHistory(localStorage.getAllTrans());
      addTranBtnEvent();
      await totalCalculate();
    });
  }

  await totalCalculate();
  showChart([totalExpData, totalBudgetLeftData >= 0 ? totalBudgetLeftData : 0]); // ← then chart

  const fired = await processDue(localStorage.saveTrans.bind(localStorage));
  if (fired > 0) {
    renderTransHistory(localStorage.getAllTrans());
    addTranBtnEvent();
    await totalCalculate();
  }
}

init();
