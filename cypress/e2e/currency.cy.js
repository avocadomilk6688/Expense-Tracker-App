/**
 * currency.cy.js — Multi-Currency Integration Test Suite
 *
 * Tests cover:
 *   - Display currency selector visibility
 *   - Supported currency list population
 *   - Currency selection functionality
 *   - Currency persistence after page reload
 *   - Multiple currency switching behavior
 *
 * Prerequisites:
 *   - App running on the port specified in cypress.config.js baseUrl
 *   - Firebase test account (maggie@gmail.com / password123) exists
 *   - User successfully authenticated before each test
 */

describe("Multi Currency Integration", () => {

 beforeEach(() => {
    // Uses baseUrl from cypress.config.js — no auth required
    cy.visit("/");
  });

  it("should render the display currency selector component", () => {
    cy.get("#displayCurrencySelect")
      .should("exist")
      .and("be.visible");
  });

  it("should load all supported currencies into the selector dropdown", () => {
    cy.get("#displayCurrencySelect option")
      .should("have.length", 11);
  });

  it("should permit changing the display currency to USD", () => {
    cy.get("#displayCurrencySelect")
      .select("USD")
      .should("have.value", "USD");
  });

  it("should permit changing the display currency to MYR", () => {
    cy.get("#displayCurrencySelect")
      .select("MYR")
      .should("have.value", "MYR");
  });

  it("should permit changing the display currency to EUR", () => {
    cy.get("#displayCurrencySelect")
      .select("EUR")
      .should("have.value", "EUR");
  });

it("should preserve the selected display currency after a page refresh", () => {
  cy.get("#displayCurrencySelect option").should("have.length", 11);
  cy.get("#displayCurrencySelect").select("USD");
  cy.wait(2000);

  cy.reload();

  cy.get("#authScreen", { timeout: 20000 }).should("not.be.visible");

  cy.get("#displayCurrencySelect", { timeout: 15000 })
    .should("have.value", "USD");
});

  it("should allow sequential switching between multiple currencies", () => {

    cy.get("#displayCurrencySelect")
      .select("USD")
      .should("have.value", "USD");

    cy.get("#displayCurrencySelect")
      .select("MYR")
      .should("have.value", "MYR");

    cy.get("#displayCurrencySelect")
      .select("EUR")
      .should("have.value", "EUR");
  });

});