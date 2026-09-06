import { access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { chromium } from 'playwright';
import { command, networkProfile, userAgent } from './lib.mjs';

export async function launchBrowser() {
  try {
    await access(chromium.executablePath());
  } catch {
    const require = createRequire(import.meta.url);

    await command(process.execPath, [
      resolve(dirname(require.resolve('playwright/package.json')), 'cli.js'),
      'install',
      'chromium',
    ]);
  }

  return chromium.launch();
}

export async function browserPage(browser, { throttled = false, intercept = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    serviceWorkers: 'block',
    userAgent,
  });

  if (intercept) await context.route('**/*', (route) => route.continue());

  const page = await context.newPage();
  const errors = [];

  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('requestfailed', (request) =>
    errors.push(`${request.url()}: ${request.failure()?.errorText}`),
  );
  const cdp = await context.newCDPSession(page);

  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

  if (throttled)
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: networkProfile.latencyMs,
      downloadThroughput: networkProfile.downloadBytesPerSecond,
      uploadThroughput: networkProfile.uploadBytesPerSecond,
      connectionType: 'cellular3g',
    });

  return { context, page, cdp, errors };
}

export function assertBrowserErrors(errors) {
  if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
}

export async function ready(page) {
  await page.locator('[data-bench-ready]').waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForLoadState('networkidle');
}
