describe("Currency Transaction Creation", () => {

  it("adds USD transaction", () => {

    cy.login();

    cy.get("#addTransName")
      .type("Coffee");

    cy.get("#addAmount")
      .type("10");

    cy.get("#currencySelect")
      .select("USD");

    cy.contains("Food")
      .click();

    cy.get("#addBtn")
      .click();

    cy.contains("Coffee")
      .should("exist");

  });

});