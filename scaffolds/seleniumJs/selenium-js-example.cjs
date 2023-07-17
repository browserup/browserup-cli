const {Builder, By, Key, until} = require('selenium-webdriver');

(async function example() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        await driver.get('http://playground.browserup.com');
        await driver.wait(until.titleIs('BrowserUp Playground'), 5000);
    } finally {
        await driver.quit();
    }
})();
