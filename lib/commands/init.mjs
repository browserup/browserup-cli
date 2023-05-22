import axios from "axios";
import { logAndExit } from "../utils/cli_helpers.mjs";
import { RemoteRuns } from "../services/remote_runs.mjs";
import { ClusterCredentialsRepository } from "../services/cluster_credentials_repository.mjs";
import { ExistingClusterValidator } from "../services/existing_cluster_validator.mjs";
import { LocalEnvVars } from "../utils/local_env_vars.mjs";
import {ProfileUtils} from "../services/profile_utils.mjs";
import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
const __dirname = path.resolve();
// const TEST_TYPES = ['postman', 'curl', 'java', 'ruby', 'python', 'playwright-js', 'playwright-python', 'selenium-ruby', 'selenium-java', 'selenium-python', 'custom']; // Replace with your actual TEST_TYPES values

let testExamples = {
    'postman': 		     { name: "PostManExample",  command: "newman run --delay-request $THINK_TIME postman-example.json" },
    'curl': 			 { name: "CurlExample",  command: "curl --write-out '%{http_code}' --show-error --silent --output /dev/null http://example.com" },
    'java': 			 { name: "JavaExample",  command: "java -jar example-1.0-all.jar" },
    'ruby': 			 { name: "RubyExample",  command: "ruby ruby-example.rb" },
    'python': 		     { name: "PythonExample",  command: "python3 python-example.py" },
    'playwrightJS': 	 { name: "PlayWrightJSExample",  command: "node playwright-js-example.js" },
    'playwrightPython': { name: "PlayWrightPyExample",  command: "python3 playwright-python-example.py" },
    'seleniumRuby':     { name: "SeleniumRbExample",  command: "ruby selenium-ruby-example.rb" },
    'seleniumJava':     { name: "SeleniumJavaExample",  command: "java -jar selenium/target/java-demo-1.0-SNAPSHOT-jar-with-dependencies.jar" },
    'seleniumPython':   { name: "SeleniumPyExample",  command: "python3 selenium-python-example.py" },
    'custom':            { name: "CustomExample",  command: "sh your_stuff.sh" }
};

const testTypes = Object.keys(testExamples);

export function init(options, programOpts) {
    let examples = new Set();

    for (let option of Object.keys(options)) {
        if (!Object.keys(testTypes).includes(option)) {
            examples.add(option);
        }
    }

    log.info(`Generating config/examples for ${Array.from(examples).join(',')}`);

    let defaults = { think_time: '30s', artifact_dir: '.', iteration_delay: '10s' };
    let exampleArr = [];

    for (let example of examples) {
        let exampleArgs = testExamples[example];
        exampleArgs = Object.assign({}, exampleArgs, defaults);
        exampleArr.push(exampleArgs);
        let templatePath = path.join(__dirname, './scaffolds', example);
        if (fs.existsSync(templatePath)) {
            log.info(`Generating example files for: ${example}`);
            fs.cpSync(templatePath, process.cwd(), {recursive: true} );
        }
    }

    exampleArr = ProfileUtils.populatePercents(exampleArr);
    let configTemplatePath = path.join(__dirname, './scaffolds', 'browserup.load.yaml-ejs');
    let template = fs.readFileSync(configTemplatePath, 'utf8');
    let templateVars = {
                        scenario_name: 'GiveMeABetterName',
                        total_users: 10,
                        exampleArr: exampleArr}

    let renderedConfig = ejs.render(template, templateVars );
    let outputPath = path.join(process.cwd(), "browserup.load.yaml");
    log.info(`Writing config for ${Array.from(examples).join(',')} at ${outputPath}`);
    fs.writeFileSync(outputPath, renderedConfig);
}
