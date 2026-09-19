import { test, expect } from '@playwright/test';

test.describe('Sudoku Master E2E', () => {
  test('should load the home page and start a solo game', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Verify title
    await expect(page.locator('text=Sudoku Master')).toBeVisible();

    // Start a solo game
    await page.click('button:has-text("Play Solo")');

    // Select difficulty
    await page.click('button:has-text("Easy")');

    // Wait for board to render
    await expect(page.locator('[role="grid"]')).toBeVisible();
    
    // Verify timer starts
    await expect(page.locator('text=0:00')).toBeVisible();
  });

  test('should allow creating a multiplayer room', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    
    // Create room
    await page.click('button:has-text("Create Room")');

    // Wait for lobby to render
    await expect(page.locator('text=Lobby')).toBeVisible();
    await expect(page.locator('text=Scan to Join')).toBeVisible();
  });
});
