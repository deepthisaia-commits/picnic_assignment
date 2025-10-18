
describe('Tote App', () => {
  it('loads and shows tote items', () => {
    cy.visit('/');
    cy.contains('Tote contents');
    cy.get('mat-list-item').should('have.length.greaterThan', 0);
  });

  it('shows error state when API down', () => {
    // Simulate API down by visiting a crafted URL that proxies to non-existing id
    cy.intercept('GET', '/api/totes/*', { forceNetworkError: true }).as('getTote');
    cy.visit('/');
    cy.wait('@getTote');
    cy.contains('Retry');
  });
});
