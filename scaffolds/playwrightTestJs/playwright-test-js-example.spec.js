// @ts-check
const { test, expect } = require('@playwright/test');
const { chromium } = require('playwright');

test('has title', async ({ }) => {
    let browser = await chromium.launch({
        executablePath: "/usr/bin/chromium",
        headless: true,
        logger: {
            isEnabled: (name, severity) => name === 'browser',
            log: (name, severity, message, args) => console.log(`${name} ${message}`)
        }
    });
    let page = await browser.newPage();

    const thinkTimeStr = process.env.THINK_TIME;
    const thinkTimeMs = parseInt(thinkTimeStr, 10) * 1000;
    const sleep = promisify(setTimeout);

    await page.goto('http://playground.browserup.com/');
    sleep(thinkTimeMs);
    await expect(page).toHaveTitle(/Playground/);
});

