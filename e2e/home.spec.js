import { test, expect } from '@playwright/test';

test.describe('עמוד הבית', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('מציג את שם המשחק', async ({ page }) => {
    await expect(page.locator('.home-title')).toHaveText('ברדקדל');
  });

  test('מציג שלושה כפתורי מצב', async ({ page }) => {
    await expect(page.locator('.mode-btn-8')).toBeVisible();
    await expect(page.locator('.mode-btn-16')).toBeVisible();
    await expect(page.locator('.mode-btn-32')).toBeVisible();
  });

  test('לחיצה על 8 מילים מנווטת למצב 8 ומציגה 8 לוחות', async ({ page }) => {
    await page.locator('.mode-btn-8').click();
    await expect(page).toHaveURL('/8');
    await expect(page.locator('.board-container')).toHaveCount(8);
  });

  test('לחיצה על 16 מילים מנווטת למצב 16 ומציגה 16 לוחות', async ({ page }) => {
    await page.locator('.mode-btn-16').click();
    await expect(page).toHaveURL('/16');
    await expect(page.locator('.board-container')).toHaveCount(16);
  });

  test('לחיצה על 32 מילים מנווטת למצב 32 ומציגה 32 לוחות', async ({ page }) => {
    await page.locator('.mode-btn-32').click();
    await expect(page).toHaveURL('/32');
    await expect(page.locator('.board-container')).toHaveCount(32);
  });
});
