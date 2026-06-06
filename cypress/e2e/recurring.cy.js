describe("Recurring Expense Workflow", () => {

  it("creates recurring expense", () => {

    cy.login();

    cy.get("#addTransName")
      .type("Netflix");

    cy.get("#addAmount")
      .type("20");

    cy.get("#currencySelect")
      .select("USD");

    cy.contains("Entertainment")
      .click();

    cy.get("#isRecurring")
      .check({ force: true });

    cy.get("#recurringFreq")
      .select("monthly");

    cy.get("#addBtn")
      .click();

    cy.contains("Recurring")
      .click();

    cy.contains("Netflix")
      .should("exist");

  });

});