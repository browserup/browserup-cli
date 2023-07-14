


<img src="./files/assets/browserup-logo.png" alt="BrowserUp" style="width: 200px;  margin-top: 25px;" />

This is the command-line interface for BrowserUp. It can be used to install BrowserUp and run load tests.

### What is BrowserUp?

BrowserUp is a suite of tools that offer a new approach to testing. Our first tool is 
a load testing tool that uses your existing assets to drive load.

The idea is simple--most companies, maintain multiple implementations of "how to talk" to your app.
We think that's a waste of time and a source of bugs.

BrowserUp takes *anything* that drives traffic, and uses _that_ to drive load for a load test,
using a unique *instrumented container* approach to scaling load.
Use your own libraries, your own code, your own tests, your own
clients, your own mobile apps, your own IOT code, your own streaming video.

A few examples of how you can drive load for a BrowserUp load test:
* Playwright
* Selenium scripts (JavaScript, Java, Python, )
* PostMan
* A REST API client in any language
* Curl
* A Mobile App
* An IOT App
* Some random code you wrote yourself in *any* language

See our [Documentation](https://browserup.github.io/docs/en/load/quick-start) for more details.

There are a few key differences between BrowserUp and other load testing tools:

* Because this isn't an _import_ it doesn't create a second implementation to maintain in a script for HTTP, or in some other
language.
* BrowserUp actually runs _your_ *asset* 
* You won't repeat yourself maintaining
a separate load test implementation. BrowserUp is the first DRY (Don't Repeat Yourself) load testing tool
* It doesn't matter what language you use. Use any language you want.
* Use _your_ code libraries. The artifact folder and anything in it or below are copied into the container.
* Your code repo becomes the source of truth.
* Most importantly, you use assets that are ready much earlier in the release cycle, 
so load testing can **shift left**  and you get feedback sooner, and release sooner. 
* If you're using browser tests, use your page objects as soon as you have them.

* No correlation, No stale-capture mistakes, No weird web IDEs, No weird scripting languages, 
No weird DSLs, No weird test frameworks

BrowserUp's instrumented containers collect all your performance stats without someone having to dig into the intricate, 
continually changing, request patterns of your app as you go from release to release.

Your load tests will be *more* accurate.

Oh, and one more thing
* Integrated front-end Core Web Vitals metrics from your *existing tests*, with no extra work on your part.


## Installation
```bash
npm install -g browserup
browserup cluster post-install
```

## Requirements

#### Local Cluster
* Docker Installed and Running (make sure it is current)
* Mac Arm64 (M1/M2) or AMD64 or Linux (Windows not yet supported)
* 32 GB Ram or more Recommended
#### Cloud Cluster
* Amazon AWS account
* Local Mac Arm64 (M1/M2) or AMD64 or Linux to operate the BrowserUp Command line Util
* Local Docker is not required for remote AWS execution, so CI/CD setup is simple

## Documentation

https://browserup.github.io/docs/en/load/quick-start

### Running from the command line:

```bash
browserup
```



## Installing for CI/CD

SKIP_DOCKER=true npm install browserup

In a CI/CD install, there may not be a local docker.  Installing this way will skip the postinstall 
scripts to verify docker is present, and pre-pull docker images.



## Running the tests:


Running a single test:
```bash
jest -t "displays load start"
```

### Testing note:

We use modules, so you need to pass this flag to node:
```bash
node --experimental-vm-modules
```

You need to pass --experimental-vm-modules to node, otherwise you will get this error:
In IntelliJ, each test needs this flag pasted into NODE OPTIONS: --experimental-vm-modules

If you don"t, you"ll see an error like:
```
Test suite failed to run

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.
```

# Running ESlint:

ESLint won't see the mjs files without help
```bash
# ESLint won't see the mjs files without help
npx eslint --ext .mjs .
```

## Licensing

This NPM package is the command-line interface for BrowserUp.
The command-line interface is AGPL-3.0 licensed.

Licensing for BrowserUp itself is handled separately, with a separate 
license and terms.
