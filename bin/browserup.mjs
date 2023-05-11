#!/usr/bin/env node
import { BrowserUpCli } from "../lib/browserup_cli.mjs";

let cli = await new BrowserUpCli()
await cli.program.parseAsync(process.argv);
