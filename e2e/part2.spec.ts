import { expect, test, type Locator, type Page } from '@playwright/test';

async function resetDemo(page: Page) {
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo data' }).click();
  await expect(
    page.getByText(/Demo data (has been )?reset/i).first(),
  ).toBeVisible();
}

async function dragLocatorToLocator(
  page: Page,
  source: Locator,
  target: Locator,
) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();
  const sBox = await source.boundingBox();
  const tBox = await target.boundingBox();
  if (!sBox || !tBox) throw new Error('Could not compute drag bounds');
  await page.mouse.move(sBox.x + sBox.width / 2, sBox.y + sBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    sBox.x + sBox.width / 2 + 12,
    sBox.y + sBox.height / 2 + 12,
    { steps: 8 },
  );
  await page.mouse.move(tBox.x + tBox.width / 2, tBox.y + tBox.height / 2, {
    steps: 24,
  });
  await page.mouse.up();
}

async function openRowActions(page: Page, rowName: RegExp | string) {
  const row = page.getByRole('row', { name: rowName }).first();
  // actions trigger is the icon-only ghost button (MoreHorizontal) in the row
  await row.locator('button').last().click();
}

test.describe.serial('Part 2 required flows', () => {
  test('palette to canvas drag with real pointer events', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/forms/new');
    await expect(
      page.getByRole('heading', { name: 'Create form' }),
    ).toBeVisible();
    await page.getByLabel('Name').fill('E2E Blank Form');
    await page.getByLabel('Slug').fill('e2e-blank-form');
    await page.getByRole('button', { name: 'Create and open builder' }).click();

    await expect(
      page.getByRole('heading', { name: 'E2E Blank Form', level: 1 }).first(),
    ).toBeVisible();
    const canvasCard = page
      .locator('div:has(> div > h3:text-is("Canvas"))')
      .first();
    const canvasDrop = page.getByText('Drop fields or elements here').first();
    await expect(canvasDrop).toBeVisible();

    const paletteItem = page.getByLabel('Drag Email to canvas or click to add');
    await dragLocatorToLocator(page, paletteItem, canvasDrop);

    await expect(page.getByText('email • key: email').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Drop fields or elements here')).toHaveCount(0);
  });

  test('publish Frontend draft with key-conflict merge flowing to Backend, DevOps, QA', async ({
    page,
  }) => {
    await resetDemo(page);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/forms');
    await openRowActions(page, /Frontend Developer/);
    await page.getByRole('menuitem', { name: /Open builder/i }).click();
    await expect(
      page.getByRole('heading', { name: 'Frontend Developer', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Unpublished changes')).toBeVisible();

    await page.getByRole('button', { name: /^Publish$/ }).click();
    await expect(page.getByText('Publish impact preview')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Backend Developer').first()).toBeVisible();
    await expect(page.getByText('DevOps Engineer').first()).toBeVisible();
    await expect(page.getByText('QA Engineer').first()).toBeVisible();

    await page.getByRole('button', { name: /^Continue$/ }).click();
    await expect(page.getByText('Key conflicts detected')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('github_url').first()).toBeVisible();
    await expect(page.getByText(/Backend Developer/).first()).toBeVisible();

    await page.getByRole('button', { name: /Merge conflicts/i }).click();
    await expect(page.getByText(/Published v3/i).first()).toBeVisible({
      timeout: 15000,
    });
    await page.waitForTimeout(500); // allow debounced localStorage persist to flush before full navigations

    // Frontend should be published (v3) with github_url as its own field
    await page.goto('/forms');
    await openRowActions(page, /Frontend Developer/);
    await page.getByRole('menuitem', { name: /Open builder/i }).click();
    await expect(
      page.getByRole('heading', { name: 'Frontend Developer', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Up to date')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('github_url').first()).toBeVisible();

    // Backend should inherit github_url (conflict merged) and no longer own it as conflicting copy
    await page.goto('/forms');
    await openRowActions(page, /Backend Developer/);
    await page.getByRole('menuitem', { name: /Open builder/i }).click();
    await expect(
      page.getByRole('heading', { name: 'Backend Developer', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('github_url').first()).toBeVisible();

    // DevOps should still resolve (inherits through Backend)
    await page.goto('/forms');
    await openRowActions(page, /DevOps Engineer/);
    await page.getByRole('menuitem', { name: /Open builder/i }).click();
    await expect(
      page.getByRole('heading', { name: 'DevOps Engineer', exact: true }),
    ).toBeVisible();

    // QA should be affected by Frontend publish and resolve
    await page.goto('/forms');
    await openRowActions(page, /QA Engineer/);
    await page.getByRole('menuitem', { name: /Open builder/i }).click();
    await expect(
      page.getByRole('heading', { name: 'QA Engineer', exact: true }),
    ).toBeVisible();
  });

  test('detach child form', async ({ page }) => {
    await resetDemo(page);

    await page.goto('/forms');
    await openRowActions(page, /QA Engineer/);
    await page.getByRole('menuitem', { name: /^Detach$/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /^Detach( form)?$/i }).click();

    await expect(page.getByText(/detached/i).first()).toBeVisible({
      timeout: 10000,
    });

    await page.goto('/forms');
    const qaRowAfter = page.getByRole('row', { name: /QA Engineer/ }).first();
    await expect(qaRowAfter.getByText(/Root( form)?/i)).toBeVisible();
  });

  test('public submit creates submission with correct version', async ({
    page,
  }) => {
    await resetDemo(page);

    await page.goto('/f/frontend-developer');
    await expect(
      page.getByRole('heading', { name: /Frontend Developer Application/i }),
    ).toBeVisible();

    await page.getByLabel(/First Name/i).fill('Playwright');
    await page.getByLabel(/Last Name/i).fill('Tester');
    await page.getByLabel(/^Email/i).fill('pw@example.com');
    await page.getByLabel(/^Phone/i).fill('555-0100');
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: 'resume.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('resume'),
      });
    await page.getByLabel(/Current Company/i).fill('Example Co');
    await page.getByLabel(/^Experience/i).fill('5');
    await page.getByLabel(/Current CTC/i).fill('100');
    await page.getByLabel(/Expected CTC/i).fill('120');

    // Notice Period select (shadcn/ui)
    await page.getByLabel(/Notice Period/i).click();
    await page.getByRole('option', { name: /30 days/i }).click();

    await page.getByLabel(/Current Location/i).fill('Remote');
    await page.getByLabel(/Portfolio URL/i).fill('https://example.com');
    await page
      .getByRole('checkbox', { name: /I agree to the processing of my data/i })
      .check();

    await page.getByRole('button', { name: /Submit/i }).click();
    await expect(page.getByText(/Submission received/i)).toBeVisible({
      timeout: 15000,
    });

    await page.goto('/forms/form_frontend/submissions');
    await expect(page.getByText(/Playwright Tester/i)).toBeVisible();
    await expect(page.getByText(/\bv2\b/).first()).toBeVisible();
  });
});
