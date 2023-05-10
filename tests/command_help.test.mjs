import {jest, expect, describe, beforeEach, afterAll, afterEach} from '@jest/globals';
//import {helpCommand} from "./helpers.mjs";
import {BrowserUpCli} from "../lib/browserup_cli.mjs";

describe('command help', function () {
    var browserupCLIOutput = '';
    let consoleOutput = '';
    let spies = [];
    let cli = null;

    beforeEach(function () {
        global.exitOverride = true;
        consoleOutput = '';
        browserupCLIOutput = '';
        ['warn', 'info', 'debug', 'error', 'fatal', 'trace'].forEach((method) => {
            let spy = jest.spyOn(log, method).mockImplementation((str) => {
                str = str.replace(/\x1b\[[0-9;]*m/g,''); //remove color codes
                consoleOutput += str + "\n";
            });
            spies << spy;
        });
        cli = new BrowserUpCli(true, {
            writeOut(str) {
                str = str.replace(/\x1b\[[0-9;]*m/g,'');
                browserupCLIOutput += str + "\n";
            }
        });
    });

    afterEach(function () {
        spies.forEach((spy) => {
            spy.mockRestore();
        });
        spies = [];
        consoleOutput = '';
        global.exitOverride = false;
    });

    function prepArgs(cmd) {
        let args = cmd.split(' ');
        args.unshift('node', 'browserup.mjs');
        args.filter(item => item !== "");
        return args;
    }

    function helpCommand(cmd){
        let expected_arr = [];

        let args = cmd.split(' ');
        args.unshift('node', 'browserup.mjs');
        let cli = new BrowserUpCli(true);
        cli = new BrowserUpCli(true, {
            writeOut(str) {
                str = str.replace(/\x1b\[[0-9;]*m/g,'');
                browserupCLIOutput += str + "\n";
            }
        });
        expect(() => {
            cli.program.parse(args);
        }).toThrow('(outputHelp)');
    }

    describe('help', function () {
        it('displays help for load start', function () {
            helpCommand('load help start' );
            expect(browserupCLIOutput).toMatch('Usage: browserup load start [options]');
        });

        it('displays help for cluster destroy', function () {
            helpCommand('cluster help destroy');
            expect(browserupCLIOutput).toMatch('Usage: browserup cluster destroy [options]');
        });

        it('displays help for cluster deploy', function () {
            helpCommand('cluster help deploy');
            expect(browserupCLIOutput).toMatch('Usage: browserup cluster deploy [options]');
        });

        it('displays help for help command', function () {
            helpCommand('load help');
            expect(browserupCLIOutput).toMatch('Usage: browserup load [options] [command]');
        });

        it('displays help with no args', function () {
            helpCommand('-h' )
            expect(consoleOutput).toMatch('Commands');
        });


        it('displays help for cluster', function () {
            helpCommand('cluster');
            expect('Usage: browserup cluster [options] [command]');
        });

    });

});
