export function runCommandOnCli(cmd, cli){
    const args = ["node", "browserup.mjs", ...cmd.split(" ")];
    try {
        cli.program.parse(args);
    } catch (e) {
        if (e.name === 'CommanderError') {
            // Not forwarding Commander errors for integration tests, verifying error output & exit code instead
            return
        }
        throw e
    }
}