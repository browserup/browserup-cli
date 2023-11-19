import {jest, expect, describe, beforeEach, afterEach} from "@jest/globals";
import {setUpIntegrationContext, tearDownIntegrationContext} from "./integration_context.mjs";
import {runCommandOnCli} from "./integration_utils.mjs";

describe("command help", () => {
    let integrationCtx

    beforeEach(function () {
        integrationCtx = setUpIntegrationContext()
    });

    afterEach(function () {
        tearDownIntegrationContext(integrationCtx)
    });

    it("displays help for load start", () => {
        runCommandOnCli("load help start", integrationCtx.cli);
        expect(integrationCtx.browserupCLIOutput).toMatch("Usage: browserup load start [options]");
        expect(integrationCtx.exitCode).toBe(0)
    });

    it("displays help for cluster destroy", () => {
        runCommandOnCli("cluster help destroy", integrationCtx.cli);
        expect(integrationCtx.browserupCLIOutput).toMatch("Usage: browserup cluster destroy [options]");
        expect(integrationCtx.exitCode).toBe(0)
    });

    it("displays help for cluster deploy", () => {
        runCommandOnCli("cluster help deploy", integrationCtx.cli);
        expect(integrationCtx.browserupCLIOutput).toMatch("Usage: browserup cluster deploy [options]");
        expect(integrationCtx.exitCode).toBe(0)
    });

    it("displays help for help command", () => {
        runCommandOnCli("load help", integrationCtx.cli);
        expect(integrationCtx.browserupCLIOutput).toMatch("Usage: browserup load [options] [command]");
        expect(integrationCtx.exitCode).toBe(0)
    });

    it("displays help with no args", () => {
        runCommandOnCli("-h", integrationCtx.cli)
        expect(integrationCtx.browserupCLIOutput).toMatch("Usage");
        expect(integrationCtx.exitCode).toBe(0)
    });

    it("displays help for cluster and returns exit code != 0 in case 'help' is not added and arguments are invalid/missing", () => {
        runCommandOnCli("cluster", integrationCtx.cli);
        expect("Usage: browserup cluster [options] [command]");
        expect(integrationCtx.exitCode).toBe(1)
    });
});
