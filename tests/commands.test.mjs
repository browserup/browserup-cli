import {jest, expect, describe, beforeEach, afterAll, afterEach} from "@jest/globals";
import {BrowserUpCli} from "../lib/browserup_cli.mjs";
import { BrowserUpError, ErrorType, decoratedError, ExitProcessError } from "../lib/browserup_errors.mjs";
import log from 'loglevel';
const originalFactory = log.methodFactory;

// Note:  Jest Spy/mocks seem to break the moment any exceptions are thrown,
// even if they are caught. Not sure why, yet.
// Because of this, you can test on output, only before an exception is thrown.
// The spy stops working after that.

describe("commands", function () {
    var browserupCLIOutput = "";
    let consoleOutput = "";
    let spies = [];
    let cli = null;

    beforeEach(function () {
        // we need to mock the logger and capture the output
        global.exitOverride = true;
        consoleOutput = "";
        browserupCLIOutput = "";

        log.methodFactory = (methodName, logLevel, loggerName) => {
            const rawMethod = originalFactory(methodName, logLevel, loggerName);
            return jest.fn((...args) => {
                // Convert the arguments to a string and append them to consoleOutput
                consoleOutput += args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ') + '\n';
                rawMethod(...args);
            });
        };
        // Make sure to set the level after setting the method factory to ensure the new methods are used
        log.setLevel('debug');

        global.log = log;
        cli = new BrowserUpCli(true, {
            writeOut(str) {
                str = str.replace(/\x1b\[[0-9;]*m/g,"");
                browserupCLIOutput += str + "\n";
            }
        });
    });

    afterEach(() => {
        log.methodFactory = originalFactory;
        spies.forEach((spy) => {
            spy.mockRestore();
        });
        spies = [];
        consoleOutput = "";
        browserupCLIOutput = "";
    });

    // afterEach(function () {
    //     spies.forEach((spy) => {
    //         spy.mockRestore();
    //     });
    //     spies = [];
    //     consoleOutput = "";
    //     global.exitOverride = false;
    // });

    function prepArgs(cmd) {
        let args = cmd.split(" ");
        args.unshift("node", "browserup.mjs");
        return args;
    }

        it("start errors with no config", async function () {
            cli.program.parse(prepArgs("load start -c ./i_dont_exist/browserup.load.yaml"));
            await new Promise(process.nextTick);
            expect(consoleOutput).toMatch("Browserup YAML does not exist");
        });

        it("start with config", async function () {
            cli.program.parse(prepArgs("load start -c ./files/browserup.load.yaml"));
            await new Promise(process.nextTick);
            expect(consoleOutput).toMatch("Starting scenario");
        });

        it("start with config and secrets", async function () {
            cli.program.parse(prepArgs("load start -c ./files/browserup.load.yaml"));
            await new Promise(process.nextTick);
            expect(consoleOutput).toMatch("Loading config from");
        });

        it("stop errors with no config", async function () {
            cli.program.parse(prepArgs("load stop -c /tmp/foo"));
            await new Promise(process.nextTick);
            expect(consoleOutput).toMatch("Browserup YAML does not exist: ");
        });

        it("status", async function () {
            cli.program.parse(prepArgs("load status -v -c ./files/browserup.load.yaml"));
            await new Promise(process.nextTick);
            expect(consoleOutput).toMatch("Loading Run IDs with active status, scenario ID filter");
        });

        it("cluster destroy errors with no config", async function () {
            cli.program.parse(prepArgs("cluster destroy -c /tmp/foo"));
            await new Promise(process.nextTick);
            expect(consoleOutput).toMatch("Browserup YAML does not exist");
        });

        it("cluster destroy with config", async function () {
            cli.program.parse(prepArgs("cluster -v destroy -c ./files/browserup.load.yaml"));
            await new Promise(process.nextTick);
            expect(consoleOutput).toMatch("Running Destroy");
        });

        it("cluster destroy with bad config path", async function () {
            cli.program.parse(prepArgs("cluster destroy -c ./i_dont_exist/browserup.load.yaml"));
            await new Promise(process.nextTick);
            expect(consoleOutput).toMatch("Browserup YAML does not exist");
        });

        it("info", async function () {
            cli.program.parse(prepArgs("cluster info -c ./files/browserup.load.yaml"));
            await new Promise(process.nextTick);
            expect(consoleOutput).toMatch("Starting Info command");
        });

        it("upgrade", async function () {
            cli.program.parse(prepArgs("cluster upgrade -c ./files/browserup.load.yaml"));
            await new Promise(process.nextTick);
            expect(consoleOutput).toMatch("Running Upgrade");
        });

        it("upload_license", async function () {
            cli.program.parse(prepArgs("cluster upload_license"));
            await new Promise(process.nextTick);
            expect(consoleOutput).toMatch("License path is empty");
        });

        it("verify", async function () {
            cli.program.parse(["node", "browserup.mjs", "load", "-v", "verify", "echo hello"]);
            await new Promise(process.nextTick);
            expect(consoleOutput).toMatch("Running Verify");
        });

        it("runs init", async function () {
            cli.program.parse(prepArgs("load init --ruby --selenium-ruby"));
            await new Promise(process.nextTick);
            expect(consoleOutput).toMatch("init");
        });

});
