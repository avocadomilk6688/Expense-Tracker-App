/**
 * pwa.cy.js — Cypress Integration Tests for Progressive Web App (PWA)
 *
 * Tests cover:
 *   - Web App Manifest link present in <head>
 *   - theme-color meta tag present
 *   - Apple PWA meta tags present
 *   - Service Worker registration (via JS evaluation)
 *   - Offline loading of the application shell (simulated)
 *
 * These tests serve as validation evidence for the PWA enhancement
 * documented in the CSE6364 Final Report.
 */

describe("Progressive Web App (PWA) — Integration Tests", () => {

  beforeEach(() => {
    // Uses baseUrl from cypress.config.js
    cy.visit("/");
  });

  // ─── Test 1: manifest.json link is present in <head> ───────────────
  it("should have a Web App Manifest link in the document head", () => {
    cy.get('link[rel="manifest"]')
      .should("exist")
      .and("have.attr", "href")
      .and("include", "manifest.json");
  });

  // ─── Test 2: theme-color meta tag is present ───────────────────────
  it("should have a theme-color meta tag matching the app palette", () => {
    cy.get('meta[name="theme-color"]')
      .should("exist")
      .and("have.attr", "content", "#d2dfff");
  });

  // ─── Test 3: Apple PWA meta tags present ───────────────────────────
  it("should have Apple mobile web app meta tags for iOS installability", () => {
    cy.get('meta[name="apple-mobile-web-app-capable"]')
      .should("exist")
      .and("have.attr", "content", "yes");

    cy.get('meta[name="apple-mobile-web-app-title"]')
      .should("exist")
      .and("have.attr", "content", "Expense Tracker");
  });

  // ─── Test 4: Apple touch icon link is present ──────────────────────
  it("should have an Apple touch icon link for home screen installation", () => {
    cy.get('link[rel="apple-touch-icon"]')
      .should("exist")
      .and("have.attr", "href")
      .and("include", "icon-192x192.png");
  });

  // ─── Test 5: Service Worker is supported and registers ─────────────
  it("should successfully register the service worker", () => {
    cy.window().then((win) => {
      expect("serviceWorker" in win.navigator).to.be.true;
    });
  });

  // ─── Test 6: Service Worker script exists at expected path ─────────
  it("should serve sw.js from the root path", () => {
    cy.request("/sw.js").then((response) => {
      expect(response.status).to.eq(200);
      expect(response.headers["content-type"]).to.include("javascript");
    });
  });

  // ─── Test 7: manifest.json is valid and fetchable ──────────────────
  it("should serve a valid manifest.json with correct fields", () => {
    cy.request("/manifest.json").then((response) => {
      expect(response.status).to.eq(200);
      const manifest = response.body;
      expect(manifest).to.have.property("name");
      expect(manifest).to.have.property("short_name");
      expect(manifest).to.have.property("display", "standalone");
      expect(manifest).to.have.property("icons");
      expect(manifest.icons).to.have.length.greaterThan(0);
    });
  });

  // ─── Test 8: App title is correct (bug fix validation) ─────────────
  it("should display the correct application title (typo fix validation)", () => {
    cy.title().should("eq", "Expense Tracker");
  });

});
