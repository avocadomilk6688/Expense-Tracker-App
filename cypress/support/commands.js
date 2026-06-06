// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })

Cypress.Commands.add("login", () => {

  cy.visit("http://localhost:5500");

  cy.get("#authEmail")
    .type("abc@gmail.com"); // Change to your test account email

  cy.get("#authPassword")
    .type("123456"); // Change to your test account password

  cy.get("#emailAuthSubmitBtn")
    .click();

  cy.get("#currencySelect", {
    timeout: 20000
  }).should("be.visible");

});

//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })