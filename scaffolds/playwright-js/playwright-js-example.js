const playwright = require("playwright");

(async () => {
    browser = await playwright.chromium.launch({
        executablePath: "/usr/bin/chromium",
        headless: true
    });
    const page = await browser.newPage();
    await page.goto("http://playground.browserup.com/");

    const html = await page.content();
    console.log(html);
    await browser.close();
})();
