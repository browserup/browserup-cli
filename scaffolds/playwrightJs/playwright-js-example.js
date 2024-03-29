const playwright = require("playwright");
const { promisify } = require('util.promisify');

(async () => {
    // important note: The standard playwright installation instructions will try to download
    // browsers into every playwright project, for each language.
    // This is not ideal for BrowserUp, because we want to share the browser binaries across
    // projects, as the browsers are large.
    //
    // So, we install playwright globally, and then we tell playwright where
    // to find the browsers. For running outside of browserup, you may need to point this
    // to the location of your browser.

    browser = await playwright.chromium.launch({
        executablePath: "/usr/bin/chromium",
        headless: true
    });
    const thinkTimeStr = process.env.THINK_TIME;
    const thinkTimeMs = parseInt(thinkTimeStr, 10) * 1000;
    const sleep = promisify(setTimeout);

    const page = await browser.newPage();
    await page.goto("http://playground.browserup.com/");

    const html = await page.content();
    console.log(html);
    sleep(thinkTimeMs);
    await browser.close();
})();
