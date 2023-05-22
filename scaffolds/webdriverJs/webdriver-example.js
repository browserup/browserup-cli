#!/usr/bin/node

const { remote } = require("webdriverio");

(async () => {
    const browser = await remote({
        logLevel: "trace",
        capabilities: {
            browserName: "chrome"
        }
    })

    await browser.url("https://example.com")
    log.info(await browser.getTitle()) // outputs: "Title is: WebdriverIO (Software) at DuckDuckGo"
    await browser.deleteSession()
})().catch((e) => log.error(e))
