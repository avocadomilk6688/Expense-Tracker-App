// ***********************************************
// Custom Cypress commands for the Expense Tracker App.
//
// The `login` command navigates to the app, authenticates
// via Firebase email/password, and waits for the dashboard
// to become visible before returning control to the test.
//
// IMPORTANT: Uses baseUrl from cypress.config.js — no
// hardcoded port numbers.
// ***********************************************

Cypress.Commands.add("login", () => {
  // Use "/" so Cypress resolves against the configured baseUrl
  cy.visit("/");

  cy.wait(500);

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

  // Wait for the auth screen to dismiss (dashboard visible)
  cy.get("#authScreen", { timeout: 20000 }).should("not.be.visible");
});