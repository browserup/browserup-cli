import {jest, expect, describe, beforeEach, afterAll, afterEach} from '@jest/globals';
import {BrowserUpCli} from "../lib/browserup_cli.mjs";
describe('commands', function () {
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
        return args;
    }

        it('start errors with no config', function () {
            cli.program.parse(prepArgs('load start'));
            expect(consoleOutput).toMatch('does not exist');
        });

        it('start with config', function () {
            cli.program.parse(prepArgs('load start -c ./files/browserup.load.yaml'));
            expect(consoleOutput).toMatch('does not exist');
        });

        it('stop errors with no config', function () {
            cli.program.parse(prepArgs('load start'));
            expect(consoleOutput).toMatch('does not exist');
        });

        it('stop with config', function () {
            cli.program.parse(prepArgs('load start -c ./files/browserup.load.yaml'));
            expect(consoleOutput).toMatch('does not exist');
        });

        it('status', function () {
            cli.program.parse(prepArgs('load status -c ./files/browserup.load.yaml'));
            expect(consoleOutput).toMatch('Cluster down');
        });

        it('cluster destroy errors with no config', function () {
            cli.program.parse(prepArgs('cluster destroy'));
            expect(consoleOutput).toMatch('does not exist');
        });

        it('cluster destroy with config', function () {
            cli.program.parse(prepArgs('cluster destroy -c ./browserup.load.yaml'));
            expect(consoleOutput).toMatch('does not exist');
        });

        it('cluster destroy with bad config path', function () {
            cli.program.parse(prepArgs('cluster destroy -c ./i_dont_exist/browserup.load.yaml'));
            expect(consoleOutput).toMatch('does not exist');
        });

        it('cluster deploy errors with no config', function () {
            cli.program.parse(prepArgs('cluster deploy'));
            expect(consoleOutput).toMatch('does not exist');
        });

        it('cluster deploy with config', function () {
            cli.program.parse(prepArgs('cluster deploy -c ./browserup.load.yaml'));
            expect(consoleOutput).toMatch('does not exist');
        });

        it('cluster deploy with config', function () {
            cli.program.parse(prepArgs('cluster deploy -c '));
            expect(consoleOutput).toMatch('does not exist');
        });

        it('info', function () {
            cli.program.parse(prepArgs('cluster info -c ./files/browserup.load.yaml'));
            expect(consoleOutput).toMatch('Starting Info Command');
        });

        it('upgrade', function () {
            cli.program.parse(prepArgs('cluster upgrade -c ./files/browserup.load.yaml'));
            expect(consoleOutput).toMatch('does not exist');
        });

        it('upload_license', function () {
            cli.program.parse(prepArgs('cluster upload_license'));
            expect(consoleOutput).toMatch('does not exist');
        });


        it('verify', function () {
            cli.program.parse(prepArgs('load verify'));
            expect(browserupCLIOutput).toMatch('error');
        });


        it('tests the spy', function () {
            cli.program.parse(prepArgs('cluster info -c ./files/browserup.load.yaml'));
            expect(consoleOutput).toMatch('does not exist');
        });

});
