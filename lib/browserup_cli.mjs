import {logErrors} from "./utils/cli_helpers.mjs";
import { Command, Option } from "commander";
import chalk from "chalk";
import "./browserup_errors.mjs";
import { ConfigRepository } from "../lib/services/config_repository.mjs";
import { Config } from "../lib/models/config.mjs";
import { copyFilesToDotFolderIfMissing } from "./utils/docker.mjs";

import { deploy } from "../lib/commands/deploy.mjs";
import { destroy } from "../lib/commands/destroy.mjs";
import { install } from "./commands/install.mjs";
import { info } from "../lib/commands/info.mjs";
import { init } from "../lib/commands/init.mjs";
import { reports } from "../lib/commands/reports.mjs";
import { start } from "../lib/commands/start.mjs";
import { status } from "../lib/commands/status.mjs";
import { stop } from "../lib/commands/stop.mjs";
import { upgrade } from "../lib/commands/upgrade.mjs";
import { uploadLicense } from "../lib/commands/upload-license.mjs";
import { verify } from "../lib/commands/verify.mjs";
import { watch } from "./commands/watch.mjs";

// Import the console-log-level module
import log from 'loglevel';
import {ErrorType, decoratedError, FakeProcessExitForTests} from "./browserup_errors.mjs";
import {BROWSERUP_DEFAULT_IMAGE} from "./constants.mjs";

export const SERVICES_VERSION = "release-1.0.15";

const originalFactory = log.methodFactory;
log.methodFactory = (methodName, logLevel, loggerName) => {
    const rawMethod = originalFactory(methodName, logLevel, loggerName);
    return message => {
        if (LogSpinner.isRunning()) {
            LogSpinner.runWithInterruptedSpinner(() => { rawMethod(message) });
        } else {
            rawMethod(message);
        }
    };
};

// Use the logger for logging messages
log.setLevel("info");
// we may have set up a mocked log in a test, so we ||= this
global.log ||= log;

import path from 'path';
import { fileURLToPath } from 'url';
import {LogSpinner} from "./utils/log_spinner.mjs";

global.appRoot = path.dirname(fileURLToPath(import.meta.url));

export class BrowserUpCli {
    program = null;

    preFlight(name, args, opts){
        global.errors = [];
        if (opts.verbose) {
            global.log.setLevel("debug");
        }
        // hidden options seem to not get defaults
        opts["servicesImageTag"] ||= SERVICES_VERSION;

        this.validateCurrentCommand(name, opts);
        if (this.commandRequiresaConfig(name)) {
              if (opts.config != null) {
                  if (opts.config == "") { opts.config = './browserup.load.yaml'}
                  log.debug(`Using config ${opts.config}`);
                  this.config = new Config(opts.config);
              }
        }
        copyFilesToDotFolderIfMissing(args["servicesImageTag"] || SERVICES_VERSION)
    }

    commandRequiresaConfig(command) {
        return ["start"].includes(command);
    }

    validateCurrentCommand(currentCommand, options) {
        if (this.commandRequiresaConfig(currentCommand)) {
            const configRepository = new ConfigRepository(options["config"]);
            configRepository.verifyYamlExists();
        }
    }

     actionRunner(fn) {
        return function (...args) {
            return fn(...args).catch(this.handleError);
        };
    }


    async runCommand(func, args, programOptions, command = null) {
            try {
                let name = func.name;
                log.info(`Running command ${chalk.green(name)}`);
                this.preFlight(name, args, programOptions);
                if (func == null) {
                    const msg = `Command ${name} not found`;
                    throw decoratedError({ type: ErrorType.INVALID_COMMAND, msg: msg })
                }
                if(command != null) {
                    await func(command, args, this.program.opts())
                }
                else {
                    await func(args, this.program.opts())
                }
            }
            catch (e) {
                this.handleError(e);
            }
    }

    handleError(error) {
        error.type ||= ErrorType.UNKNOWN;
        logErrors(error);
        if (global.exitOverride) {
            // don't handle this--it is how we stop tests without blowing up the test process.
            // our test expectations are expecting it to be thrown, so we don't want to handle it.
            let e = new FakeProcessExitForTests(error);
            throw e;

        } else {
            process.exit(1);
        }

    }

    constructor(exitOverride = false, outHsh = null) {
        this.program = new Command();
        const line = chalk.blue("============================\n");
        const banner = line + chalk.hex("#de792b")("Browser") + chalk.hex("#6e6e6e")("Up ") + chalk.hex("#a1bfbf")("Load CLI\n") + line;

        this.program.hook("preSubcommand", (thisCommand, subcommand) => {
            log.info(banner);
        });

        if (global.exitOverride){ this.program.exitOverride()}
        if (outHsh != null) { this.program.configureOutput(outHsh);}
        const load = this.program.command("load");
        if(global.exitOverride) { load.exitOverride(); }
        load.description("Load test commands");
        if (outHsh != null) { load.configureOutput(outHsh);}

        const cluster = this.program.command("cluster");
        cluster.description("Cluster commands");
        if(global.exitOverride) { cluster.exitOverride(); }
        if (outHsh != null) { cluster.configureOutput(outHsh);}

        this.program
            .option("-v, --verbose", "Enable verbose output. Disabled unless BROWSERUP_CLI_VERBOSE env variable set", false)
            .option("-a, --api-token <string>", "Your API token. Or export BROWSERUP_API_TOKEN. Required only for remote tests")
            .option("-c, --config <string>", "Path to browserup.load.yaml configuration file", "./browserup.load.yaml" )
            .version("0.0.1", "-V, --version", "Print the version")
            .action(()=> { log.info(banner); this.program.help()});

        cluster
            .command("deploy")
            .description("Deploy a BrowserUp cluster")
            .addOption(new Option('-m, --cluster-type <string>', "Cluster type, either 'local' or 'aws'")
                .choices(['local', 'aws'])
                .default('local'))
            .addOption(new Option(
                "-s, --services-image-tag <string>",
                "Dev only - override default image tag for grid-java-api, grid-coordinator, minion and webconsole"
            ).hideHelp())
            .addOption(new Option(
                "-S, --standard-image-tag <string>",
                "Dev only - override default image tag for 'standard' image"
            ).hideHelp())
            .option("-g, --region <string>", "AWS Region", "us-east-2")
            .addOption(new Option(
                "-e, --admin-emails <string>",
                "Space separated list of emails to receive system notifications"
            ).default([]).hideHelp())
            .option("-k, --key-pair <string>", "Optional AWS Key Pair name to use for ECS cluster")
            .option("-mk, --minion-key-pair <string>", "Optional AWS Key Pair name to use for ECS minion instances")
            .option("-l, --use-local-cache", "Optional flag for local deployment to use images from local docker cache if available")
            .action(async (args) => {
                await this.runCommand(deploy, args, this.program.opts());
            });
        cluster
            .command("destroy")
            .description("Destroy a BrowserUp cluster")
            .option("--name <string>", "Cluster name to destroy. Defaults to one created by this machine")
            .option("--remove-volumes", "Optional flag to remove volumes associated with the cluster")
            .action(async (args) => {
                await this.runCommand(destroy, args, this.program.opts());
            });
        cluster
            .command("upgrade")
            .description("Upgrade a BrowserUp cluster")
            .option("--skip-confirmation", "Optional flag to skip confirmation prompt")
            .action(async (args) => {
                await this.runCommand(upgrade, args, this.program.opts());
            });
        cluster
            .command("upload-license")
            .description("Upload a license to the BrowserUp cluster")
            .requiredOption("-p, --path <string>", "Path to license file")
            .action(async (args) => {
                await this.runCommand(uploadLicense, args, this.program.opts());
            });
        cluster
            .command("info")
            .description("Show cluster's information")
            .action(async (args) => {
                await this.runCommand(info, args, this.program.opts());
            });

        cluster
            .command("install")
            .description("Download the BrowserUp images into the local Docker")
            .action(async (args) => {
                await this.runCommand(install, args, this.program.opts());
            });

        load
            .command("load", "Load test commands")

        load
            .command('verify')
            .argument("<command>", "Command to run in container.")
            .description("Verify a command string runs in our container and produces traffic")
            .option("-i, --image <string>", "Image name to execute for verification", BROWSERUP_DEFAULT_IMAGE)
            .option("-k, --keep", "Commit running image to passed name to make it available for debugging after it is prepared", true)
            .option("-s, --show-har", "If show-har is passed, the captured traffic is output as a HAR file", false)
            .option("-r, --artifact-dir <string>", "Directory to copy into container at /home/browserup/artifact, which is also the working dir at container start", ".")
            .option("-d, --databank <string>", "Path to databank CSV file. CSV file must have header row and at least one row with values")
            .action(async (command,args, programOptions  ) => {
                await this.runCommand(verify, args, this.program.opts(), command);}
            );


        load
            .command("init")
            .description("init a config, and working examples config (browserup.load.yaml).")
            .option("--postman", "Init a sample script with Postman for API tests")
            .option("--curl", "Init a sample script with cURL for API tests")
            .option("--java", "Init a sample script with Java for API tests")
            .option("--ruby", "Init a sample script with Ruby for API tests")
            .option("--python", "Init a sample script with Python for API tests")
            .option("--csharp", "Init a sample solution with C# for API tests")
            .option("--playwright-js", "Init a sample script with PlayWright using JavaScript")
            .option("--playwright-test-js", "Init a sample script with Test PlayWright using JavaScript")
            .option("--playwright-python", "Init a sample script with PlayWright using Python")
            .option("--playwright-pytest-python", "Init a sample script with PlayWright using Pytest and Python")
            .option("--playwright-csharp", "Init a dotnet solution with PlayWright using C#. Requires compilation.")
            .option("--selenium-js", "Init a sample script with Selenium using JavaScript")
            .option("--selenium-java", "Init a sample script with Selenium using Java")
            .option("--selenium-python", "Init a sample script with Selenium using Python")
            .option("--selenium-ruby", "Init a sample script with Selenium using Ruby")
            .option("--selenium-csharp", "Init a sample dotnet solution with C#. Requires compilation.")
            .option("--custom", "Init a sample script with a custom framework or tool")
            .summary("Generate a config w/ examples.")
            .action(async (args) => {
                await this.runCommand(init, args, this.program.opts());
            });
        load
            .command("status")
            .description("Show the status of the last load run")
            .option("-s, --scenario <string>", "A valid scenario name from the browserup.load.yaml configuration file. The first scenario found is used by default")
            .action(async (args) => {
                await this.runCommand(status, args, this.program.opts());
            });

        load
            .command("stop")
            .description("Stop the running load test in the deployed BrowserUp cluster. Pass -d to also destroy the cluster")
            .option("-s, --scenario <string>", "Optional scenario ID from the browserup.load.yaml configuration file")
            .option("-r, --run-id)", "Optional run ID to stop")
            .option("-d, --destroy", "Optional flag to destroy the cluster after stopping the test")
            .action(async (args) => {
                await this.runCommand(stop, args, this.program.opts());
            });


        const reportSummary = `${chalk.hex("#FFA500")("SLA Reports")}

  Run SLA reports defined in the config and optionally save (-s) them as HTML files.

  Each report metric may have Service Level Objective checks defined. The reports command executes all defined checks. 
  - If all checks ${chalk.green("pass")}, for all reports, the return code is ${chalk.green("0")}. 
  - If any checks ${chalk.red("fail")}, the return code is ${chalk.red("1")}.

    ${chalk.blue("--save (-s) [optional folder]")}

  If save is passed, each report is downloaded as a standalone .html file to the save folder.

    ${chalk.blue("--name (-n)")}  Name of the report to run. 
                                       Pass ${chalk.green("all")} to run both the system and config reports.
                                       To run a single report, pass the report"s name. 
                                       This name may be any system report or report defined in the config.
                                       
  The ${chalk.blue("name")} option selects the reports that the reports command will utilize.

  Pass ${chalk.green("config")} to use the reports defined in the config file. These reports are under ${chalk.blue("reports:")} key in the config file.

  The ${chalk.green("system")} option runs these standard system-defined reports:

    ${chalk.green("bandwidth connections errors hits profiles steps summary system urls vitals websockets")}\n`

        load
            .command("reports")
            .description("Run SLA reports defined in the config and optionally save (-s) them as HTML files.")
            .requiredOption("-n, --name <string>", "Name of the report to run. Or pass \"config\" for reports defined in the yaml, \"system\" for standard reports or pass \"all\" for both")
            .option("-o, --output <string>", "Save report output to the specified local folder path", "./reports")
            .option("-u, --no-upload", "Do not upload the defined report", true)
            .action(async (args) => {
                await this.runCommand(reports, args, this.program.opts());
            });
        /*
        // Watch is broken at the moment
        load
            .command("watch")
            .description("Watch a load test run with the terminal")
            .action(async (args) => {
                await this.runCommand(watch, args, this.program.opts());
            });
        */
        load
            .command("start")
            .description("Starts a test after uploading all test data. Cluster must be running unless -d (deploy) is passed")
            .option("-s, --scenario <string>", "A valid scenario ID from the browserup.load.yaml configuration file. The first scenario found is used by default.")
            .option("-d, --deploy", "If BrowserUp is not deployed, deploy before starting the test.")
            .option("-r, --redeploy", "Teardown existing cluster beforehand if present, deploy again before starting.")
            .option("-t, --cluster-type <string>", "Cluster type, either \"local\" or \"aws\".", "local")
            .option("-g, --region <string>", "AWS Region", "us-east-2")
            .option("-i, --instance <string>", "AWS instance type", "m5a.xlarge")
            .option("-e, --admin-emails <string>", "Space separated list of emails to receive system notifications", [])
            .option("-k, --key-pair <string>", "Optional AWS Key Pair name to use for ECS cluster")
            .option("--no-create-key-pair", "Optional flag to not create AWS Key Pair for ECS cluster and save it. Ignored in case key-pair is provided")
            .action(async (args) => {
                await this.runCommand(start, args, this.program.opts());
            });

    }

}

