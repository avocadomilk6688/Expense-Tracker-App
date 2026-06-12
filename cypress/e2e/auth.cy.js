/**
 * auth.cy.js — Core End-to-End Integration Tests
 *
 * Tests cover:
 *   - Search/filter keyword input
 *   - Expense name input
 *   - Category budget tab toggle
 *
 * Prerequisites:
 *   - App running on the port specified in cypress.config.js baseUrl
 *   - Firebase test account (maggie@gmail.com / password123) exists
 */

describe("Expense Tracker Application - Core End-to-End Integration Test Suite", () => {

  beforeEach(() => {
    // Uses baseUrl from cypress.config.js
    cy.visit("/");
    cy.wait(500);

    // Authenticate past the login gateway
    cy.get("#authScreen").then(($screen) => {
      if ($screen.is(":visible")) {
        cy.get("#authEmail").clear().type("maggie@gmail.com");
        cy.get("#authPassword").then(($pass) => {
          if ($pass.is(":visible") && !$pass.is(":disabled")) {
            cy.wrap($pass).clear().type("password123");
            cy.get("#emailAuthSubmitBtn").click();
          }
        });
      }
    });

    // Confirm the auth screen is dismissed before running assertions
    cy.get("#authScreen", { timeout: 20000 }).should("not.be.visible");
  });

  it("should permit real-time interactive character entry within the keyword filter components", () => {
    cy.get("#searchKeyword")
      .should("be.visible")
      .type("Walmart Grocery Run")
      .should("have.value", "Walmart Grocery Run");
  });

  it("should capture and process vendor string value assignments inside input fields", () => {
    cy.get("#addTransName")
      .should("be.visible")
      .type("Netflix Subscription")
      .should("have.value", "Netflix Subscription");
  });

  it("should alter dashboard view states to render specific limit tracking bars upon interaction", () => {
    cy.get("#categoryBudgetsContainerBlock").should("not.be.visible");
    cy.get("#categoryBudgetsTabBtn").click();
    cy.get("#categoryBudgetsContainerBlock").should("be.visible");
    cy.get(".form-container").should("not.be.visible");
  });
});
