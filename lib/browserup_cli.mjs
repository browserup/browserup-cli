import {logAndExit} from "./utils/cli_helpers.mjs";
import { Command, Option } from "commander";
import chalk from "chalk";
import "../lib/exceptions.mjs";
import { ConfigRepository } from "../lib/services/config_repository.mjs";
import {BrowserUpPaths} from "./utils/browserup_paths.mjs";

export const SERVICES_VERSION = "1.0.0";

import { deploy } from "../lib/commands/deploy.mjs";
import { destroy } from "../lib/commands/destroy.mjs";
import {consoleStart} from "./commands/console.mjs";
import { info } from "../lib/commands/info.mjs";
import { init } from "../lib/commands/init.mjs";
import { reports } from "../lib/commands/reports.mjs";
import { start } from "../lib/commands/start.mjs";
import { status } from "../lib/commands/status.mjs";
import { stop } from "../lib/commands/stop.mjs";
import { upgrade } from "../lib/commands/upgrade.mjs";
import { uploadLicense } from "../lib/commands/upload_license.mjs";
import { uploadScenario } from "../lib/commands/upload_scenario.mjs";
import { verify } from "../lib/commands/verify.mjs";
import {Config} from "../lib/models/config.mjs";
import {copyFilesToDotFolderIfMissing} from "./utils/docker.mjs";
// Import the console-log-level module
import logLevel from "console-log-level";

// Use the logger for logging messages
global.log = logLevel({level: ((process.env.BROWSERUP_CLI_VERBOSE) ? "debug" : "info")});

export class BrowserUpCli {
    program = null;

    init(args, opts){
        global.errors = [];

        this.validateCurrentCommand(args[0]);
        copyFilesToDotFolderIfMissing(opts["services_image_tag"])

        if (opts) {
              if (opts.config != null) {
                  this.config = new Config(opts.config);
              }
        }
    }

    validateCurrentCommand(currentCommand, options) {
        if (["report", "start", "stop", "upload_license"].includes(currentCommand)) {
            const configRepository = new ConfigRepository(options["config"]);
            configRepository.verifyYamlExists();
        }
    }

    deployCmd = (...args) => {
        this.init(args, this.program.opts());
        deploy(args, this.program.opts())
            .then(result => log.debug("Completed Successfully"))
            .catch(error => this.handleError(error));
    };
    

    destroyCmd = (...args) => {
        this.init(args, this.program.opts());
        destroy(args, this.program.opts())
            .then(result => log.debug("Completed Successfully"))
            .catch(error => this.handleError(error));
    };


    infoCmd = (...args) => {
        this.init(args, this.program.opts());
        info(args, this.program.opts())
            .then(result =>
                log.debug("Completed Successfully")
            )
            .catch(error => this.handleError(error));
    };

    consoleCmd = (...args) => {
        this.init(args, this.program.opts());
        consoleStart(args, this.program.opts())
            .then(result =>
                log.debug("Completed Successfully")
            )
            .catch(error => this.handleError(error));
    };


    initCmd = (...args) => {
        this.init(args, this.program.opts());
        init(args, this.program.opts())
            .then(result => log.debug("Completed Successfully"))
            .catch(error => this.handleError(error));
    };

    reportsCmd = (...args) => {
        this.init(args, this.program.opts());
        reports(args, this.program.opts())
            .then(result => log.debug("Completed Successfully"))
            .catch(error => this.handleError(error));
    };



    startCmd = (...args) => {
        this.init(args, this.program.opts());
        start(args, this.program.opts())
            .then(result => log.debug("Completed Successfully"))
            .catch(error => this.handleError(error));
    };


    statusCmd = (...args) => {
        this.init(args, this.program.opts());
        status(args, this.program.opts())
            .then(result => log.debug("Completed Successfully"))
            .catch(error => this.handleError(error));
    };

    stopCmd = (...args) => {
        this.init(args, this.program.opts());
        stop(args, this.program.opts())
            .then(result => log.debug("Completed Successfully"))
            .catch(error => this.handleError(error));
    };

    upgradeCmd = (...args) => {
        this.init(args, this.program.opts());
        upgrade(args, this.program.opts())
            .then(result => log.debug("Completed Successfully"))
            .catch(error => this.handleError(error));
    };

    uploadLicenseCmd = (...args) => {
        this.init(args, this.program.opts());
        uploadLicense(args, this.program.opts())
            .then(result => log.debug("Completed Successfully"))
            .catch(error => this.handleError(error));
    };

    uploadScenarioCmd = (...args) => {
        this.init(args, this.program.opts());
        uploadScenario(args, this.program.opts())
            .then(result => log.debug("Completed Successfully"))
            .catch(error => this.handleError(error));
    };

    verifyCmd = (...args) => {
        this.init(args, this.program.opts());
        verify(args, this.program.opts())
            .then(result => log.debug("Completed Successfully"))
            .catch(error => this.handleError(error));
    };

    handleError(error) {
        const className = error.constructor.name;

        switch (className) {
            case "ClusterNewerThanCLI":
                return logAndExit("Cluster is newer than CLI, update CLI", error);
                break;
            case "ClusterOlderThanCLI":
                return logAndExit("Cluster is older than CLI, upgrade cluster", error);
                break;
            case "UploadError":
                return logAndExit(`${error.message}`);
                break;
            case "BrowserUpNoReportsDefined":
                return logAndExit(`${error.message}`);
                break;
            case "NoLastRunIdError":
                return logAndExit(`${error.message}`);
                break;
            case "BrowserUpClusterNotFound":
                return logAndExit(`${error.message}`);
                break;
            case "BrowserUpYamlMissing":
                return logAndExit(`${error.message}`);
                break;
            case "CommanderError":
                return logAndExit(`${error.message}`);
                break;
            case "UploadLicenseError":
                return logAndExit(`Error Uploading license ${error.message}`, error);
                break;
            case "TypeErrorCONNECT":
                log.error("Connection Refused - Unable to Contact remote host");
                break;
            case "Error":
                return logAndExit(`Failed ${error.message}`, error);
                break;
            case "InvalidClusterCredentials":
                return logAndExit("Could not find credentials for an active cluster");
                break;
            case "InvalidConfigException":
                return logAndExit("Invalid config file", error);
                break;
            case "ClusterAlreadyExistsException":
                return logAndExit("Cluster exists - consider "destroy" first to terminate current cluster", error);
                break;
            default:
                return logAndExit("Unknown error", error);
        }
        return;
    }

    constructor(exitOverride = false, outHsh = null) {
        this.program = new Command();
        const line = chalk.blue("============================\n");
        const banner = line + chalk.hex("#de792b")("Browser") + chalk.hex("#3a3a3a")("Up ") + chalk.hex("#c1dfef")("Load CLI\n") + line;

        this.program.hook("preSubcommand", (thisCommand, subcommand) => {
            log.info(banner)
        });

        if (global.exitOverride){ this.program.exitOverride()}
        if (outHsh != null) { this.program.configureOutput(outHsh);}
        const load = this.program.command("load");
        if(global.exitOverride) { load.exitOverride(); };
        load.description("Load test commands");
        if (outHsh != null) { load.configureOutput(outHsh);}

        const cluster = this.program.command("cluster");
        cluster.description("Cluster commands");
        if(global.exitOverride) { cluster.exitOverride(); };
        if (outHsh != null) { cluster.configureOutput(outHsh);}

        this.program
            .option("-v, --verbose", "Enable verbose output. Disabled unless BROWSERUP_CLI_VERBOSE env variable set", false)
            .option("-a, --api-token <string>", "Your API token. Or export BROWSERUP_API_TOKEN. Required only for remote tests")
            .option("-c, --config <string>", "Path to browserup.load.yaml configuration file", "./browserup.load.yaml" )
            .addOption(new Option("-s, --services-image-tag <string>", "Dev only - override default image tag for grid-java-api, grid-coordinator, minion and webconsole").hideHelp())
            .addOption(new Option("-S, --standard-image-tag <string>", "Dev only - override default image tag for "standard" image").hideHelp())
            .version("0.0.1", "-V, --version", "Print the version")
            .action(()=> { log.info(banner); this.program.help()});

        cluster
            .command("deploy")
            .description("Deploy a BrowserUp cluster")
            .option("-m, --cluster_type <string>", "Cluster type, either \"local\" or \"aws\".", "local")
            .option("-g, --region <string>", "AWS Region", "us-east-2")
            .option("-t, --instance <string>", "AWS instance type", "m5a.xlarge")
            .option("-e, --admin_emails <string>", "Space separated list of emails to receive system notifications", [])
            .option("-k, --key_pair <string>", "Optional AWS Key Pair name to use for ECS cluster")
            .option("-m, --minion_key_pair <string>", "Optional AWS Key Pair name to use for ECS minion instances")
            .action(this.deployCmd);

        cluster
            .command("destroy")
            .description("Destroy a BrowserUp cluster")
            .option("--name <string>", "Cluster name to destroy. Defaults to one created by this machine")
            .option("--remove_volumes", "Optional flag to remove volumes associated with the cluster")
            .action(this.destroyCmd);

        cluster
            .command("upgrade")
            .description("Upgrade a BrowserUp cluster")
            .option("skip-confirmation", "Optional flag to skip confirmation prompt")
            .action(this.upgradeCmd);

        cluster
            .command("upload_license")
            .description("Upload a license to the BrowserUp cluster")
            .option(("path <string>"), "Path to license file")
            .action(this.uploadLicenseCmd);

        cluster
            .command("info")
            .description("Show cluster"s information")
            .action(this.infoCmd);


        load
            .command("load", "Load test commands")

        load
            .command("verify [command]")
            .description("Verify a command string runs in our container and produces traffic")
            .option("-i, --image <string>", "Image name to execute for verification")
            .option("-a, --artifact_dir <string>", "Directory to copy into container at /home/browserup/artifact, which is also the working dir at container start")
            .option("-d, --databank <string>", "Path to databank CSV file. CSV file must have header row and at least one row with values")
            .action(this.verifyCmd);

        load
            .command("init")
            .description("init a config, and working examples config (browserup.load.yaml).")
            .option("--postman", "Init a sample script with Postman")
            .option("--curl", "Init a sample script with cURL")
            .option("--java", "Init a sample script with Java")
            .option("--ruby", "Init a sample script with Ruby")
            .option("--python", "Init a sample script with Python")
            .option("--playwright-js", "Init a sample script with PlayWright using JavaScript")
            .option("--playwright-python", "Init a sample script with PlayWright using Python")
            .option("--selenium-ruby", "Init a sample script with Selenium using Ruby")
            .option("--selenium-java", "Init a sample script with Selenium using Java")
            .option("--selenium-python", "Init a sample script with Selenium using Python")
            .option("--custom", "Init a sample script with a custom framework or tool")
            .summary("Generate a config w/ examples.")
            .action(this.initCmd);

        load
            .command("status")
            .description("Show the status of the last load run")
            .option("-s, --scenario <string>", "A valid scenario name from the browserup.load.yaml configuration file. The first scenario found is used by default")
            .action(this.statusCmd);

        load
            .command("start")
            .description("Starts a test after uploading all test data. Cluster must be running unless -d (deploy) is passed")
            .option("-s, --scenario <string>", "A valid scenario ID from the browserup.load.yaml configuration file. The first scenario found is used by default.")
            .option("-d, --deploy", "If BrowserUp is not deployed, deploy before starting the test.")
            .option("-r, --redeploy", "Teardown existing cluster beforehand if present, deploy again before starting.")
            .option("-t, --cluster_type <string>", "Cluster type, either \"local\" or \"aws\".", "local")
            .option("-g, --region <string>", "AWS Region", "us-east-2")
            .option("-i, --instance <string>", "AWS instance type", "m5a.xlarge")
            .option("-e, --admin_emails <string>", "Space separated list of emails to receive system notifications", [])
            .option("-k, --key_pair <string>", "Optional AWS Key Pair name to use for ECS cluster")
            .option("--no-create_key_pair", "Optional flag to not create AWS Key Pair for ECS cluster and save it. Ignored in case key_pair is provided")
            .action(this.startCmd);

        load
            .command("stop")
            .description("Stop the running load test in the deployed BrowserUp cluster. Pass -d to also destroy the cluster")
            .option("-s, --scenario <string>", "Optional scenario ID from the browserup.load.yaml configuration file")
            .option("-r, --run_id)", "Optional run ID to stop")
            .option("-d, --destroy", "Optional flag to destroy the cluster after stopping the test");

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
            .option("-n, --name <string>", "Name of the report to run. Or pass "config" for reports defined in the yaml, "system" for standard reports or pass "all" for both", "")
            .option("-o, --output <string>", "Save report output to the specified local folder path", "./reports")
            .option("-u, --no-upload", "Do not upload the defined report", true)
            .action(this.reportsCmd);


        load
            .command("console")
            .description("Watch a load test run with the terminal console")
            .action(this.consoleCmd);

    }

}

