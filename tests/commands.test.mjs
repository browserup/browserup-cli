import {jest, expect, describe, beforeEach, afterEach} from "@jest/globals";
import {BrowserUpCli} from "../lib/browserup_cli.mjs";
import log from 'loglevel';
import {CommanderError} from "commander";
const originalFactory = log.methodFactory;

describe("commands", function () {
    let browserupCLIOutput = "";
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
                //rawMethod(...args);
            });
        };

        // Make sure to set the level after setting the method factory to ensure the new methods are used
        log.setLevel('debug');
//        const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation((...args) => {
  //          consoleOutput += args.join('\n');
    //    });

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

        it("start errors with no config", function () {

            cli.program.parse(prepArgs("load start -c ./i_dont_exist/browserup.load.yaml"));
            expect(consoleOutput).toMatch("Browserup YAML does not exist");
        });

        it("start with config", function () {
            cli.program.parse(prepArgs("load start -c ./files/browserup.load.yaml"));
            expect(consoleOutput).toMatch("Starting scenario");
        });

        it("start with config and secrets", function () {
            cli.program.parse(prepArgs("load start -c ./files/browserup.load.yaml"));

            expect(consoleOutput).toMatch("Loading config from");
        });

        it("status", function () {
            cli.program.parse(prepArgs("load status -v -c ./files/browserup.load.yaml"));
            expect(consoleOutput).toMatch("Status completed successfully");
        });

        it("cluster destroy errors with no config", function () {
            cli.program.parse(prepArgs("cluster destroy -c /tmp/foo"));
            expect(consoleOutput).toMatch("Clearing Secrets since they are invalid.");
        });

        it("cluster destroy with config", function () {
            cli.program.parse(prepArgs("cluster -v destroy -c ./files/browserup.load.yaml"));
            expect(consoleOutput).toMatch("Running Destroy");
        });

        it("cluster destroy", function () {
            expect(() => {
                cli.program.parse(prepArgs("cluster upload-license"));
            }).toThrow(CommanderError);
        });

        it("info", function () {
            cli.program.parse(prepArgs("cluster info -c ./files/browserup.load.yaml"));
            expect(consoleOutput).toMatch("Starting Info command");
        });

        it("watch", function () {
            cli.program.parse(prepArgs("load watch"));
            expect(consoleOutput).toMatch("Starting Watch command");
        });

        it("upgrade", function () {
            cli.program.parse(prepArgs("cluster upgrade -c ./files/browserup.load.yaml"));
            expect(consoleOutput).toMatch("Running Upgrade");
        });

        it("upload-license", function () {
            expect(() => {
                cli.program.parse(prepArgs("cluster upload-license"));
            }).toThrow(CommanderError);
        });

        it("upload-license with bad path", function () {
            expect(() => {
            cli.program.parse(prepArgs("cluster upload-license -p /tmp"));
            expect(consoleOutput).toMatch("Starting Info command");
            }).toThrow();
        });

        it("verify", function () {
            cli.program.parse(["node", "browserup.mjs", "load", "-v", "verify", "echo hello"]);
            expect(consoleOutput).toMatch("Running Verify");
        });

        it("runs init", function () {
            cli.program.parse(prepArgs("load init --ruby --selenium-ruby"));
            expect(consoleOutput).toMatch("init");
        });

});
