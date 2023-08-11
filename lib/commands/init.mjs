import {ProfileUtils} from "../services/profile_utils.mjs";
import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import {getAbsolutePathFromRelativeToRoot} from "../utils/path_utils.mjs";

// const TEST_TYPES = ['postman', 'curl', 'java', 'ruby', 'python', 'playwright-js', 'playwright-python', 'selenium-ruby', 'selenium-java', 'selenium-python', 'custom']; // Replace with your actual TEST_TYPES values

let testExamples = {
    'postman': 		      { name: "PostManExample",
                            command: "newman run --delay-request $THINK_TIME ./postman/postman-example.json" },
    'curl': 			  { name: "CurlExample",
                            command: "curl --write-out '%{http_code}' --show-error --silent --output /dev/null http://playground.browserup.com" },
    'csharp':             { name: "CSharpExample",
                            command: "dotnet ./csharp/CSharpExample/bin/Release/net7.0/csharp-example.dll" },
    'java': 			  { name: "JavaExample",
                            command: "java -jar ./java/example-1.0-all.jar" },
    'ruby': 			  { name: "RubyExample",
                            command: "ruby ./ruby/ruby-example.rb" },
    'python': 		      { name: "PythonExample",
                            command: "python3 ./python/python-example.py" },
    'playwrightJs': 	  { name: "PlaywrightJSExample",
                            command: "node ./playwrightJs/playwright-js-example.js" },
    'playwrightTestJs':   { name: "PlaywrightTestJSExample",
                            command: "npx playwright test ./playwrightTestJs/playwright-test-js-example.spec.js" },
    'playwrightPython':   { name: "PlaywrightPyExample",
                            command: "python3 ./playwrightPython/playwright-python-example.py" },
    'playwrightPytestPython':
                          { name: "PlaywrightPyPytestExample",
                            command: "pytest ./playwrightPytestPython/playwright-pytest-python-example.py" },
    'playwrightCsharp':   { name: "PlaywrightCSharpExample",
                            command: "dotnet ./playwrightCsharp/bin/Release/net7.0/playwright-csharp-example.dll" },
    'seleniumCsharp': 	  { name: "SeleniumCSharpExample",
                            command: "dotnet ./seleniumCsharp/bin/Release/net7.0/selenium-csharp-example.dll" },
    'seleniumRuby':       { name: "SeleniumRbExample",
                            command: "ruby ./seleniumRuby/selenium-ruby-example.rb" },
    'seleniumJava':       { name: "SeleniumJavaExample",
                            command: "java -jar ./seleniumJava/target/java-demo-1.0-SNAPSHOT-jar-with-dependencies.jar" },
    'seleniumJs':         { name: "SeleniumJsExample",
                            command: "node ./seleniumJs/selenium-js-example.cjs" },
    'seleniumPython':     { name: "SeleniumPyExample",
                            command: "python3 ./seleniumPython/selenium-python-example.py" },
    'custom':             { name: "CustomExample",
                            command: "sh your_stuff.sh" }
};

const testTypes = Object.keys(testExamples);

export function init(options, _programOpts) {
    let examples = new Set();

    for (let option of Object.keys(options)) {
        if (!Object.keys(testTypes).includes(option)) {
            examples.add(option);
        }
    }

    let defaults = { think_time: '30s', artifact_dir: '.', iteration_delay: '10s' };
    let exampleArr = [];

    for (let example of examples) {
        let exampleArgs = testExamples[example];
        exampleArgs = Object.assign({}, exampleArgs, defaults);
        exampleArr.push(exampleArgs);
        let templatePath = getAbsolutePathFromRelativeToRoot('./scaffolds', example)
        if (fs.existsSync(templatePath)) {
            log.info(`Generating example files for: ${example}`);
            let destinationPath = path.join(process.cwd(), example);
            fs.cpSync(templatePath, destinationPath, {recursive: true} );
        }
    }

    exampleArr = ProfileUtils.populatePercents(exampleArr);
    let configTemplatePath = getAbsolutePathFromRelativeToRoot('scaffolds', 'browserup.load.yaml-ejs')
    let template = fs.readFileSync(configTemplatePath, 'utf8');
    let templateVars = {
                        scenario_name: 'GiveMeABetterName',
                        total_users: 10,
                        exampleArr: exampleArr}

    let renderedConfig = ejs.render(template, templateVars );
    let outputPath = path.join(process.cwd(), "browserup.load.yaml");
    let exampleStr = Array.from(examples).join(',');
    if (exampleStr.includes('csharp')) {
        log.info('Before running your test, make sure to run:  dotnet build --configuration Release');
    }
    if (exampleStr.includes('java')) {
        log.info('Make sure to run: mvn exec:java -Dexec.mainClass="org.example.Main"');
    }
    log.info(`Writing config for ${Array.from(examples).join(',')} at ${outputPath}`);
    fs.writeFileSync(outputPath, renderedConfig);
}

