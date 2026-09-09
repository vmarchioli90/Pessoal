const { expect } = require('@playwright/test');

class BlogPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.searchButton = page.getByRole('button', { name: /pesquisar|search/i });
    this.searchInput = page.locator('input[name="s"]:visible, input[type="search"]:visible');
    this.articleTitles = page.locator('article h2 a, article h3 a');
    this.pageTitle = page.locator('h1, .page-title').first();
    this.noResultsMessage = page.getByText(/nada foi encontrado|nenhum resultado|não encontramos|sem resultado/i);
  }

  async open() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.acceptCookiesIfVisible();
    await expect(this.page).toHaveURL(/blog(doagi\.com\.br|\.agibank\.com\.br)/i);
  }

  async searchFor(term) {
    await this.searchButton.click();
    const visibleSearchInput = this.searchInput.first();
    await expect(visibleSearchInput).toBeVisible();
    await visibleSearchInput.fill(term);
    await visibleSearchInput.press('Enter');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectSearchUrlWith(term) {
    await expect(this.page).toHaveURL(new RegExp(`[?&]s=${encodeURIComponent(term)}`, 'i'));
  }

  async expectResultsRelatedTo(term) {
    await expect(this.pageTitle).toContainText(new RegExp(term, 'i'));
    const relatedArticles = this.articleTitles.filter({ hasText: new RegExp(term, 'i') });
    await expect(relatedArticles.first()).toBeVisible();
  }

  async expectNoResultsFeedback() {
    await expect(this.noResultsMessage.first()).toBeVisible();
  }

  async acceptCookiesIfVisible() {
    const acceptButton = this.page.getByRole('button', {
      name: /aceitar|accept|concordo|ok/i
    });

    if (await acceptButton.first().isVisible().catch(() => false)) {
      await acceptButton.first().click();
    }
  }
}

module.exports = { BlogPage };
