import {jest, expect, describe, beforeEach, afterAll, afterEach} from "@jest/globals";
import {BrowserUpCli} from "../lib/browserup_cli.mjs";
describe("commands", function () {
    var browserupCLIOutput = "";
    let consoleOutput = "";
    let spies = [];
    let cli = null;

    beforeEach(function () {
        global.exitOverride = true;
        consoleOutput = "";
        browserupCLIOutput = "";
        ["warn", "info", "debug", "error", "fatal", "trace"].forEach((method) => {
            let spy = jest.spyOn(log, method).mockImplementation((str) => {
                str = str.replace(/\x1b\[[0-9;]*m/g,""); //remove color codes
                consoleOutput += str + "\n";
            });
            spies << spy;
        });
        cli = new BrowserUpCli(true, {
            writeOut(str) {
                str = str.replace(/\x1b\[[0-9;]*m/g,"");
                browserupCLIOutput += str + "\n";
            }
        });
    });

    afterEach(function () {
        spies.forEach((spy) => {
            spy.mockRestore();
        });
        spies = [];
        consoleOutput = "";
        global.exitOverride = false;
    });

    function prepArgs(cmd) {
        let args = cmd.split(" ");
        args.unshift("node", "browserup.mjs");
        return args;
    }

        it("start errors with no config", function () {
            cli.program.parse(prepArgs("load start"));
            expect(consoleOutput).toMatch("Config missing");
        });

        it("start with config", function () {
            cli.program.parse(prepArgs("load start -c ./files/browserup.load.yaml"));
            expect(consoleOutput).toMatch("Starting scenario");
        });

        it("start with config but no secrets", function () {
            cli.program.parse(prepArgs("load start -c ./files/browserup.load.yaml"));
            expect(consoleOutput).toMatch("No secrets file found");
        });

        it("start with config and secrets", function () {
            cli.program.parse(prepArgs("load start -c ./files/browserup.load.yaml"));
            expect(consoleOutput).toMatch("No secrets file found");
        });

        it("stop errors with no config", function () {
            cli.program.parse(prepArgs("load start"));
            expect(consoleOutput).toMatch("Config missing");
        });

        it("stop with config but no secrets", function () {
            cli.program.parse(prepArgs("load stop -c ./files/browserup.load.yaml"));
            expect(consoleOutput).toMatch("No secrets file found");
        });

        it("status", function () {
            cli.program.parse(prepArgs("load status -c ./files/browserup.load.yaml"));
            expect(consoleOutput).toMatch("No active cluster credentials found");
        });

        it("cluster destroy errors with no config", function () {
            cli.program.parse(prepArgs("cluster destroy"));
            expect(consoleOutput).toMatch("Config missing");
        });

        it("cluster destroy with config", function () {
            cli.program.parse(prepArgs("cluster destroy -c ./files/browserup.load.yaml"));
            expect(consoleOutput).toMatch("does not exist");
        });

        it("cluster destroy with bad config path", function () {
            cli.program.parse(prepArgs("cluster destroy -c ./i_dont_exist/browserup.load.yaml"));
            expect(consoleOutput).toMatch("Config missing");
        });

        it("cluster deploy errors with no config", function () {
            cli.program.parse(prepArgs("cluster deploy"));
            expect(consoleOutput).toMatch("Config missing");
        });

        it("cluster deploy with config", function () {
            cli.program.parse(prepArgs("cluster deploy -c ./browserup.load.yaml"));
            expect(consoleOutput).toMatch("Deploy");
        });

        it("cluster deploy with config", function () {
            cli.program.parse(prepArgs("cluster deploy -c "));
            expect(consoleOutput).toMatch("does not exist");
        });

        it("info", function () {
            cli.program.parse(prepArgs("cluster info -c ./files/browserup.load.yaml"));
            expect(consoleOutput).toMatch("Starting Info command");
        });

        it("upgrade", function () {
            cli.program.parse(prepArgs("cluster upgrade -c ./files/browserup.load.yaml"));
            expect(consoleOutput).toMatch("Running Upgrade");
        });

        it("upload_license", function () {
            cli.program.parse(prepArgs("cluster upload_license"));
            expect(consoleOutput).toMatch("Config missing at");
        });

        it("verify", function () {
            cli.program.parse(prepArgs("load verify -c ./files/browserup.load.yaml"));
            expect(browserupCLIOutput).toMatch("error");
        });


});
