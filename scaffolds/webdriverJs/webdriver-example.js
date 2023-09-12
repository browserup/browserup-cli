#!/usr/bin/node

const { remote } = require("webdriverio");

(async () => {
    const browser = await remote({
        logLevel: "trace",
        capabilities: {
            browserName: "chrome"
        }
    })

    const thinkTimeMs = parseInt(process.env.THINK_TIME, 10) * 1000;
    const sleep = promisify(setTimeout);

    await browser.url("https://example.com")
    log.info(await browser.getTitle()) // outputs: "Title is: WebdriverIO (Software) at DuckDuckGo"
    sleep(thinkTimeMs);
    await browser.deleteSession()
})().catch((e) => log.error(e))
