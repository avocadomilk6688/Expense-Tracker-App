/**
 * charts.cy.js — Cypress Integration Tests for Chart.js Analytics Section
 *
 * Strategy: These tests validate the STRUCTURAL PRESENCE of chart elements
 * in the DOM. The analytics section HTML is always present in the page
 * regardless of auth state (it's rendered server-side in index.html).
 *
 * This approach mirrors pwa.cy.js — validate implementation artifacts
 * without requiring Firebase authentication.
 *
 * Full chart RENDERING (populated with data) requires authentication
 * and is validated via manual screenshots documented in
 * docs/screenshots/CHARTS_SCREENSHOT_CHECKLIST.md
 */

describe("Chart.js Analytics Dashboard — Integration Tests", () => {

  beforeEach(() => {
    // Uses baseUrl from cypress.config.js — no auth required
    cy.visit("/");
  });

  // ─── Test 1: Analytics section renders in the DOM ──────────────────
  it("should render the analytics section on the page", () => {
    cy.get(".analytics-section")
      .should("exist");
  });

  // ─── Test 2: Analytics title is correct ────────────────────────────
  it("should display the 'Spending Analytics' section title", () => {
    cy.get(".analytics-title")
      .should("contain.text", "Spending Analytics");
  });

  // ─── Test 3: Category Doughnut Chart canvas exists ─────────────────
  it("should render a canvas element for the Category Breakdown doughnut chart", () => {
    cy.get("#categoryDoughnutChart")
      .should("exist");
  });

  // ─── Test 4: Monthly Trend Line Chart canvas exists ────────────────
  it("should render a canvas element for the Monthly Trend line chart", () => {
    cy.get("#monthlyTrendChart")
      .should("exist");
  });

  // ─── Test 5: Empty-state containers exist in DOM ───────────────────
  it("should have empty-state fallback containers for both charts", () => {
    cy.get("#categoryChartEmpty").should("exist");
    cy.get("#trendChartEmpty").should("exist");
  });

  // ─── Test 6: Charts grid layout renders correctly ──────────────────
  it("should render the charts inside the two-column grid layout", () => {
    cy.get(".charts-grid").should("exist");
    cy.get(".chart-card").should("have.length", 2);
  });

  // ─── Test 7: Chart canvases have ARIA labels for accessibility ─────
  it("should have ARIA labels on chart canvases for screen reader support", () => {
    cy.get("#categoryDoughnutChart")
      .should("have.attr", "role", "img")
      .and("have.attr", "aria-label");

    cy.get("#monthlyTrendChart")
      .should("have.attr", "role", "img")
      .and("have.attr", "aria-label");
  });

  // ─── Test 8: Chart.js CDN script is loaded ─────────────────────────
  it("should load the Chart.js library from CDN", () => {
    cy.get('script[src*="chart.js"]')
      .should("exist");
  });

});
