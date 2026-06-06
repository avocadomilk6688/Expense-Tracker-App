describe("Multi Currency Integration", () => {

  beforeEach(() => {
    cy.visit("http://localhost:5500");

    cy.get("#authScreen")
      .invoke("css", "display", "none");
  });

  it("loads display currency selector", () => {

    cy.get("#displayCurrencySelect")
      .should("exist");

  });

});