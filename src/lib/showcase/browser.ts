/**
 * Headless browser launcher for server-side showcase rendering.
 *
 * The showcase effects are CSS 3D / box-shadow / backdrop-filter compositions
 * rendered in the DOM, so the only way to get pixel-identical output is to
 * render the real React components in a real browser and screenshot them.
 *
 * - Local / self-hosted: point `puppeteer-core` at the system Chrome/Edge
 *   (no multi-hundred-MB Chromium download — we reuse what's already on the
 *   machine). Override with PUPPETEER_EXECUTABLE_PATH / CHROME_PATH.
 * - Vercel / AWS Lambda: use `@sparticuz/chromium`, the standard serverless
 *   Chromium build.
 */

import fs from 'node:fs';
import type { Browser, LaunchOptions } from 'puppeteer-core';

function isServerless(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.FUNCTIONS_WORKER_RUNTIME
  );
}

/** Common Chrome/Edge install locations, checked when no env override is set. */
const LOCAL_CHROME_CANDIDATES: string[] = [
  // Windows
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  // macOS
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  // Linux
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/microsoft-edge',
];

function resolveLocalExecutable(): string {
  const override = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
  if (override) {
    if (!fs.existsSync(override)) {
      throw new Error(`Browser executable not found at PUPPETEER_EXECUTABLE_PATH/CHROME_PATH: ${override}`);
    }
    return override;
  }
  const found = LOCAL_CHROME_CANDIDATES.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(
      'No local Chrome/Edge found. Install Chrome or set PUPPETEER_EXECUTABLE_PATH to a Chromium-based browser.'
    );
  }
  return found;
}

/**
 * Launch a headless Chromium suitable for the current environment.
 * Caller is responsible for `await browser.close()`.
 */
export async function launchBrowser(): Promise<Browser> {
  const puppeteer = await import('puppeteer-core');

  if (isServerless()) {
    const chromium = (await import('@sparticuz/chromium')).default;
    const options: LaunchOptions = {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: null,
    };
    return puppeteer.launch(options);
  }

  const options: LaunchOptions = {
    headless: true,
    executablePath: resolveLocalExecutable(),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars'],
  };
  return puppeteer.launch(options);
}
