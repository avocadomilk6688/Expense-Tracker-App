describe("Multi Currency Integration", () => {

  beforeEach(() => {
    cy.visit("/");

     // Wait a moment for Firebase to auto-login from cached session
    cy.wait(1000);

     cy.get("#authScreen").then(($screen) => {
    if ($screen.is(":visible")) {
      cy.get("#authEmail").clear().type("maggie@gmail.com");
      cy.get("#authPassword").clear({ force: true }).type("password123", { force: true });
      cy.get("#emailAuthSubmitBtn").click({ force: true });
    }
  });

    cy.get("#authScreen", { timeout: 20000 }).should("not.be.visible");
    cy.get("#displayCurrencySelect option", { timeout: 10000 }).should("have.length", 11);
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
    cy.get("#displayCurrencySelect").select("USD");
    cy.wait(2000);

    cy.reload();
    cy.wait(1000);


    cy.get("#authScreen").then(($screen) => {
      if ($screen.is(":visible")) {
        cy.get("#authEmail").clear().type("maggie@gmail.com");
        cy.get("#authPassword").clear({ force: true }).type("password123", { force: true });
        cy.get("#emailAuthSubmitBtn").click({ force: true });
      }
    });

    cy.get("#authScreen", { timeout: 20000 }).should("not.be.visible");
    cy.get("#displayCurrencySelect", { timeout: 15000 })
      .should("have.value", "USD");
  });

  it("should allow sequential switching between multiple currencies", () => {
    cy.get("#displayCurrencySelect").select("USD").should("have.value", "USD");
    cy.get("#displayCurrencySelect").select("MYR").should("have.value", "MYR");
    cy.get("#displayCurrencySelect").select("EUR").should("have.value", "EUR");
  });

});