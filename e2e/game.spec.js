import { test, expect } from '@playwright/test';

async function goToGame(page, mode = '16') {
  await page.goto('/');
  await page.locator(`.mode-btn-${mode}`).click();
  await expect(page).toHaveURL(`/${mode}`);
}

async function pressKey(page, letter) {
  await page.getByRole('button', { name: letter }).first().click();
}

async function typeWord(page, letters) {
  for (const letter of letters) {
    await pressKey(page, letter);
  }
}

test.describe('מבנה המשחק', () => {
  test('מצב 16 מציג 16 לוחות עם 23 שורות כל אחד', async ({ page }) => {
    await goToGame(page, '16');
    await expect(page.locator('.board-container')).toHaveCount(16);
    await expect(page.locator('.board-container').first().locator('.row')).toHaveCount(23);
  });

  test('מצב 8 מציג 8 לוחות עם 15 שורות', async ({ page }) => {
    await goToGame(page, '8');
    await expect(page.locator('.board-container')).toHaveCount(8);
    await expect(page.locator('.board-container').first().locator('.row')).toHaveCount(15);
  });

  test('מצב 32 מציג 32 לוחות עם 39 שורות', async ({ page }) => {
    await goToGame(page, '32');
    await expect(page.locator('.board-container')).toHaveCount(32);
    await expect(page.locator('.board-container').first().locator('.row')).toHaveCount(39);
  });

  test('הכותרת מציגה מספר ניחושים ולוחות נכון', async ({ page }) => {
    await goToGame(page, '16');
    await expect(page.locator('.app-subtitle')).toContainText('0/23');
    await expect(page.locator('.app-subtitle')).toContainText('0/16');
  });
});

test.describe('מקלדת ואינטראקציה', () => {
  test.beforeEach(async ({ page }) => {
    await goToGame(page, '16');
  });

  test('מציג מקלדת עברית', async ({ page }) => {
    await expect(page.locator('.keyboard')).toBeVisible();
    for (const letter of ['א', 'ב', 'ש', 'ת']) {
      await expect(page.getByRole('button', { name: letter, exact: true })).toBeVisible();
    }
  });

  test('הקלדת אות מוסיפה תא tbd בשורה הנוכחית', async ({ page }) => {
    await pressKey(page, 'א');
    await expect(page.locator('.tile.tbd')).not.toHaveCount(0);
  });

  test('מחיקה אחרי הקלדה מסירה את האות', async ({ page }) => {
    await pressKey(page, 'א');
    await expect(page.locator('.tile.tbd')).not.toHaveCount(0);
    await page.getByRole('button', { name: 'מחיקה' }).click();
    await expect(page.locator('.tile.tbd')).toHaveCount(0);
  });

  test('שליחת מילה לא מוכרת מציגה הודעת שגיאה', async ({ page }) => {
    await typeWord(page, ['א', 'א', 'א', 'א', 'א']);
    await page.getByRole('button', { name: 'אישור' }).click();
    await expect(page.locator('.message-invalid')).toBeVisible();
  });

  test('שליחת מילה תקנית מתקבלת ומציגה תאים עם צבע', async ({ page }) => {
    // ישראל — מאושר כמילה תקנית ב-valid_guesses.json
    await typeWord(page, ['י', 'ש', 'ר', 'א', 'ל']);
    await page.getByRole('button', { name: 'אישור' }).click();
    await expect(page.locator('.message-invalid')).not.toBeVisible();
    await expect(page.locator('.tile.correct, .tile.present, .tile.absent').first()).toBeVisible();
    await expect(page.locator('.app-subtitle')).toContainText('1/23');
  });

  test('אחרי ניחוש תקין תאי המקלדת מתעדכנים', async ({ page }) => {
    await typeWord(page, ['י', 'ש', 'ר', 'א', 'ל']);
    await page.getByRole('button', { name: 'אישור' }).click();
    await expect(
      page.locator('.key-cell-correct, .key-cell-present, .key-cell-absent').first()
    ).toBeVisible();
  });
});

test.describe('ניווט', () => {
  test('כפתור הבית חוזר לעמוד הראשי', async ({ page }) => {
    await goToGame(page, '16');
    await page.locator('.btn-home').click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('.home-title')).toBeVisible();
  });

  test('badge מצב מציג את מספר הלוחות הנכון', async ({ page }) => {
    await goToGame(page, '8');
    await expect(page.locator('.mode-badge')).toHaveText('8 לוחות');

    await page.locator('.btn-home').click();
    await goToGame(page, '32');
    await expect(page.locator('.mode-badge')).toHaveText('32 לוחות');
  });
});

test.describe('מובייל — Enter/Delete בשורה ראשונה', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('כפתור אישור נמצא בשורה הראשונה של המקלדת', async ({ page }) => {
    await goToGame(page, '16');
    const firstRow = page.locator('.keyboard-row').first();
    await expect(firstRow.getByRole('button', { name: 'אישור' })).toBeVisible();
  });

  test('כפתור מחיקה נמצא בשורה הראשונה של המקלדת', async ({ page }) => {
    await goToGame(page, '16');
    const firstRow = page.locator('.keyboard-row').first();
    await expect(firstRow.getByRole('button', { name: 'מחיקה' })).toBeVisible();
  });
});
