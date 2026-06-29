const { test } = require('@playwright/test');
const { BlogPage } = require('../pages/blogPage');

test.describe('Busca de artigos no Blog do Agi', () => {
  test('deve buscar por um termo existente e exibir resultados relacionados', async ({ page }) => {
    const blogPage = new BlogPage(page);
    const termoBuscado = 'FGTS';

    await blogPage.open();
    await blogPage.searchFor(termoBuscado);

    await blogPage.expectSearchUrlWith(termoBuscado);
    await blogPage.expectResultsRelatedTo(termoBuscado);
  });

  test('deve informar quando nao existem resultados para o termo pesquisado', async ({ page }) => {
    const blogPage = new BlogPage(page);
    const termoInexistente = 'termoqaautomatizadoinexistente123';

    await blogPage.open();
    await blogPage.searchFor(termoInexistente);

    await blogPage.expectSearchUrlWith(termoInexistente);
    await blogPage.expectNoResultsFeedback();
  });
});
