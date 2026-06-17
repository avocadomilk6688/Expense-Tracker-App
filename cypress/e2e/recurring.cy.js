/**
 * recurring.cy.js — Recurring Expense Integration Tests
 *
 * Tests cover:
 *   - Enabling recurring mode
 *   - Selecting recurring frequencies
 *   - Creating recurring expenses
 *   - Validating recurring labels in the recurring section
 *
 * Prerequisites:
 *   - App running on the port specified in cypress.config.js baseUrl
 *   - Firebase test account (maggie@gmail.com / password123) exists
 *   - Custom cy.loginAndVisit() command configured (see commands.js below)
 */

describe("Recurring Expense Integration Tests", () => {

 beforeEach(() => {
    cy.visit("/", {
      onBeforeLoad(win) {
        win.localStorage.setItem("recurringExpenses", JSON.stringify([]));
      },
    });

    cy.get("#authScreen", { timeout: 20000 }).should("not.be.visible");
  });

  // ---------------------------------------------------------------------------
  // Frequency toggle visibility
  // ---------------------------------------------------------------------------

  it("should display recurring frequency dropdown when recurring is checked", () => {
    cy.get("#isRecurring").check({ force: true });
    cy.get("#recurringFreq").should("be.visible");
  });

  it("should hide recurring frequency when recurring is unchecked", () => {
    cy.get("#isRecurring").uncheck({ force: true });
    cy.get("#recurringFreq").should("not.be.visible");
  });

  // ---------------------------------------------------------------------------
  // Frequency selection
  // ---------------------------------------------------------------------------

  it("should allow selecting daily frequency", () => {
    cy.get("#isRecurring").check({ force: true });
    cy.get("#recurringFreq").select("daily").should("have.value", "daily");
  });

  it("should allow selecting weekly frequency", () => {
    cy.get("#isRecurring").check({ force: true });
    cy.get("#recurringFreq").select("weekly").should("have.value", "weekly");
  });

  it("should allow selecting monthly frequency", () => {
    cy.get("#isRecurring").check({ force: true });
    cy.get("#recurringFreq").select("monthly").should("have.value", "monthly");
  });

  // ---------------------------------------------------------------------------
  // Create recurring expenses
  // ---------------------------------------------------------------------------
 
  it("should create a recurring weekly expense successfully", () => {
    const recurringName = `Gym_${Date.now()}`;
 
    cy.get("#addTransName").type(recurringName);
    cy.get("#addAmount").type("15");
    cy.get("#currencySelect").select("USD");
    cy.get(".tags-conatiner").contains("Health & Medical 🏥").click();
    cy.get("#isRecurring").check({ force: true });
    cy.get("#recurringFreq").select("weekly");
    cy.get("#addBtn").click();
    cy.get("#addTransName").should("have.value", "");
    cy.get("#recTabBtn").click();
 
    cy.get(".recurring-list.show", { timeout: 15000 }).should("exist");
    cy.get(".money-history-container").contains(recurringName).should("exist");
    cy.get(".money-history-container").contains("weekly").should("exist");
  });
 
  it("should create a recurring monthly expense successfully", () => {
    const recurringName = `Netflix_${Date.now()}`;
 
    cy.get("#addTransName").type(recurringName);
    cy.get("#addAmount").type("200");
    cy.get("#currencySelect").select("CNY");
    cy.get(".tags-conatiner").contains("Entertainment 🎬").click();
    cy.get("#isRecurring").check({ force: true });
    cy.get("#recurringFreq").select("monthly");
    cy.get("#addBtn").click();
    cy.get("#addTransName").should("have.value", "");
    cy.get("#recTabBtn").click();

    cy.get(".recurring-list.show", { timeout: 15000 }).should("exist");
    cy.get(".money-history-container").contains(recurringName).should("exist");
    cy.get(".money-history-container").contains("monthly").should("exist");
  });
 
});
 