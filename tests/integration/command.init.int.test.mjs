import {jest, expect, describe, beforeEach, afterEach} from "@jest/globals";
import {setUpIntegrationContext, tearDownIntegrationContext} from "./integration_context.mjs";
import {runCommandOnCli} from "./integration_utils.mjs";

import fs from "fs";
import {readYaml} from "../test.utils.mjs";

describe("command init", () => {
    let ctx

    beforeEach(() => {
        ctx = setUpIntegrationContext()
    });

    afterEach(() => {
        tearDownIntegrationContext(ctx)
    });

    describe("having --curl type specified", () => {
        it("creates config with curl scenario", () => {
            runCommandOnCli("load init --curl", ctx.cli);

            expect(ctx.exitCode).toBe(0)
            expect(fs.existsSync(ctx.browserupYamlConfigPath)).toBe(true)

            const parsedYaml = readYaml(ctx.browserupYamlConfigPath)
            expect(parsedYaml).toBeTruthy()
            expect(parsedYaml.scenario.profiles.length).toBe(1)
        });
    })

    describe("having --curl and --postman types specified", () => {
        it("creates config with curl scenario", () => {
            runCommandOnCli("load init --curl --postman", ctx.cli);

            expect(ctx.exitCode).toBe(0)
            expect(fs.existsSync(ctx.browserupYamlConfigPath)).toBe(true)

            const parsedYaml = readYaml(ctx.browserupYamlConfigPath)
            expect(parsedYaml).toBeTruthy()
            expect(parsedYaml.scenario.profiles.length).toBe(2)
            expect(parsedYaml.scenario.profiles[0].command).toMatch('curl')
            expect(parsedYaml.scenario.profiles[1].command).toMatch('newman')
        });
    })

    describe("with invalid type specified", function () {
        it("displays warning and returns with exit code != 0", function () {
            runCommandOnCli("load init", ctx.cli);

            expect(ctx.exitCode).toBe(1)
            expect(ctx.consoleOutput).toMatch("No load type specified");
            expect(fs.existsSync(ctx.browserupYamlConfigPath)).toBe(false)
        });

        it("displays warning and returns with exit code != 0", function () {
            runCommandOnCli("load init --unknown", ctx.cli);

            expect(ctx.exitCode).toBe(1)
            expect(ctx.browserupCLIOutput).toMatch("unknown option");
            expect(fs.existsSync(ctx.browserupYamlConfigPath)).toBe(false)
        });
    })

});
