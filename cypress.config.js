const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // Centralized baseUrl — all cy.visit("/") calls resolve to this.
    // Start the dev server on port 8080 before running Cypress:
    //   npx live-server --port=8080 --no-browser
    baseUrl: "http://127.0.0.1:8080",

    // Default command timeout (ms) — gives Firebase auth time to respond
    defaultCommandTimeout: 10000,

    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
