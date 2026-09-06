import { browserPage, assertBrowserErrors, launchBrowser } from './browser.mjs';
import { cliMeasure, isMain, median, networkProfile, numberOption, sleep } from './lib.mjs';

// Executed before application scripts. performance.now() starts at navigation timeOrigin.
// Visibility checks exclude React's hidden streamed fragments until they become visible.
export function installObserver() {
  window.__benchTimes = { counterMs: null, deferredMs: null };
  const visible = (element) =>
    element &&
    element.getClientRects().length > 0 &&
    getComputedStyle(element).visibility !== 'hidden';

  function inspect() {
    const counter = document.querySelector('[data-bench-counter]');
    const deferred = document.querySelector('[data-bench-deferred]');

    if (
      window.__benchTimes.counterMs === null &&
      visible(counter) &&
      /^Count: [1-9]\d*$/.test(counter.textContent.trim())
    )
      window.__benchTimes.counterMs = performance.now();

    if (
      window.__benchTimes.deferredMs === null &&
      visible(deferred) &&
      deferred.textContent === 'Details for item 01.'
    )
      window.__benchTimes.deferredMs = performance.now();
  }
  new MutationObserver(inspect).observe(document, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
  });

  function frame() {
    inspect();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

export async function interactionSample(browser, baseUrl, route) {
  const { context, page, errors } = await browserPage(browser, { throttled: true });
  try {
    await page.addInitScript(installObserver);
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'commit', timeout: 30000 });

    if (response.status() !== 200) throw new Error(`HTTP ${response.status()}: ${route}`);

    if (route === '/') {
      const button = page.locator('[data-bench-counter]');

      await button.waitFor({ state: 'visible', timeout: 30000 });
      const deadline = performance.now() + 30000;
      let attempts = 0;
      while (performance.now() < deadline) {
        // Real mouse input, with no wait for hydration, network-idle, or a framework marker.
        const box = await button.boundingBox();

        if (box) {
          await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
          attempts++;
        }

        const value = await page.evaluate(() => window.__benchTimes.counterMs);

        if (value !== null) {
          assertBrowserErrors(errors);

          return { ms: value, clickAttempts: attempts };
        }

        await sleep(25);
      }
      throw new Error('Counter never responded');
    }

    await page.waitForFunction(() => window.__benchTimes.deferredMs !== null, null, {
      timeout: 30000,
    });
    const value = await page.evaluate(() => window.__benchTimes.deferredMs);

    assertBrowserErrors(errors);

    return { ms: value };
  } finally {
    await context.close();
  }
}

export async function measureInteractive(app, server, opts, browser) {
  const count = numberOption(opts.runs, opts.quick ? 2 : 5, 'runs');
  const result = { runs: count, networkProfile, probeIntervalMs: 25, counter: {}, deferred: {} };
  for (const [name, route] of [
    ['counter', '/'],
    ['deferred', '/items/1'],
  ]) {
    const samples = [];
    for (let i = 0; i < count; i++)
      samples.push(await interactionSample(browser, server.baseUrl, route));
    result[name] = { route, medianMs: median(samples.map((sample) => sample.ms)), samples };
  }

  return result;
}

if (isMain(import.meta.url))
  await cliMeasure(async (app, server, opts) => {
    const browser = await launchBrowser();
    try {
      return { interactive: await measureInteractive(app, server, opts, browser) };
    } finally {
      await browser.close();
    }
  });
