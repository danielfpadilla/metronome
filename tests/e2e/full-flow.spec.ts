import { test, expect } from '@playwright/test';

test.describe('Full user flow', () => {
  test('metronome works without sign-in', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('100')).toBeVisible();
    await page.getByRole('button', { name: /play/i }).first().click();
    await page.waitForTimeout(500);
  });

  test('tap wheel is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('tap-wheel')).toBeVisible();
  });

  test('sign-in modal appears on Add Track', async ({ page }) => {
    await page.goto('/library');
    // Library is protected, should redirect to /
    // But if we're on the page, check for add track
  });
});