import {jest} from "@jest/globals";
import {BrowserUpCli} from "../../lib/browserup_cli.mjs";

import fs from "fs";
import os from "os";
import path from "path";

class IntegrationContext {
    constructor() {
        this.browserupCLIOutput = "";
        this.consoleOutput = "";
        this.spies = [];
        this.cli = null;
        this.exitCode = 0;
        this.testDir = undefined
        this.browserupYamlConfigPath = undefined
    }
}

export function setUpIntegrationContext() {
    global.exitOverride = true;

    let tmpdir = createTempDir()
    process.stdout.write(`Current test directory: ${tmpdir}`)
    process.chdir(tmpdir);

    const integrationContext = new IntegrationContext();
    integrationContext.testDir = tmpdir;
    integrationContext.browserupYamlConfigPath = `${integrationContext.testDir}/browserup.load.yaml`;
    ["warn", "info", "debug", "error"].forEach((method) => {
        let spy = jest.spyOn(log, method).mockImplementation((str) => {
            str = str.replace(/\x1b\[[0-9;]*m/g, ""); //remove color codes
            integrationContext.consoleOutput += str + "\n";
        });
        integrationContext.spies.push(spy);
    });
    const outputConfiguration = {
        writeOut(str) {
            integrationContext.browserupCLIOutput += str + "\n";
        },
        writeErr(str) {
            integrationContext.browserupCLIOutput += str + "\n";
        }
    }
    const exitCallback = (err, isRethrowingRequired = true) => {
        if (err === undefined) return;
        // Command.help in node_modules/commander/lib/command.js
        if (err.exitCode !== undefined) {
            integrationContext.exitCode = err.exitCode
        } else {
            integrationContext.exitCode = 1
        }
        if (isRethrowingRequired) {
            throw err
        }
    }
    integrationContext.cli = new BrowserUpCli(exitCallback, outputConfiguration);
    return integrationContext
}

export function tearDownIntegrationContext(integrationCtx) {
    if (integrationCtx === undefined) return

    integrationCtx.spies.forEach((spy) => {
        spy.mockRestore();
    });
    integrationCtx.spies = [];
    integrationCtx.consoleOutput = "";
    integrationCtx.browserupCLIOutput = "";

    // Uncomment to remove tmp dir after test
    // fs.rmSync(integrationCtx.testDir, { recursive: true });
}

function createTempDir() {
    let tmpDir;
    const appPrefix = 'browserup-int-test';
    try {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), appPrefix));
    } catch (ex) {
        // handle error
    }
    return tmpDir;
}