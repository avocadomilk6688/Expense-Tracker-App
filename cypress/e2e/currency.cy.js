describe("Multi Currency Integration", () => {

  beforeEach(() => {
    // Uses baseUrl from cypress.config.js
    cy.visit("/");
    cy.wait(500);

    // Authenticate past login
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

    cy.get("#authScreen", { timeout: 20000 }).should("not.be.visible");
  });

  it("loads display currency selector", () => {
    cy.get("#displayCurrencySelect")
      .should("exist");
  });

});