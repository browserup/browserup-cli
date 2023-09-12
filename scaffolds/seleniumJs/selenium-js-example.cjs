const {Builder, By, Key, until} = require('selenium-webdriver');

(async function example() {
    let driver = await new Builder().forBrowser('chrome').build();

    const thinkTimeMs = parseInt(process.env.THINK_TIME, 10) * 1000;
    const sleep = promisify(setTimeout);

    try {
        await driver.get('http://playground.browserup.com');
        await driver.wait(until.titleIs('BrowserUp Playground'), 5000);
        sleep(thinkTimeMs);
    } finally {
        await driver.quit();
    }
})();
