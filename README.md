# BrowserUp

The [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) Load Testing Tool

## What is BrowserUp?

BrowserUp is a suite of open source tools that offer a new approach to testing. Our first tool is 
a load testing tool that lets you use your existing assets to drive load.

The idea is simple--if you are like most companies, you maintain multiple implementations of "how to talk" to your app.
We think that's a waste of time, and a source of bugs.

BrowserUp Load Test lets you take *anything* that drives traffic, and use _that_ to drive load for a load test.
BrowserUp uses a unique model of scaling instrumented containers to drive load.
You can take any asset that can run in a container, and use it to drive load.

Use your own libraries, your own scripts, your own code, your own tests, your own
clients, your own mobile apps, your own IOT code, your own streaming video.

A few examples of how you can drive load for a BrowserUp load test:
* Playwright
* Selenium scripts (JavaScript, Java, Python, )
* PostMan
* A REST API client in any language
* Curl
* A Mobile App
* An IOT App
* Streaming video
* Some random code you wrote yourself in *any* language

There are a few key differences between BrowserUp and other load testing tools:

* Because this isn't an _import_ it doesn't createa a second implementation to maintain in a script for HTTP, or in some other
language.
* We actually run _your_ *asset* 
* you won't repeat yourself maintaining
a separate load test implementation. We are the first DRY (Don't Repeat Yourself) load testing tool
* Because it runs your code, it doesn't matter what language you use. Use any language you want.
* Because it runs your code, you can use _your_ code libraries. The artifact folder and anything in it or below are mounted into the container.
* Your code repo becomes the source of truth.
* Most importantly, these differences let you use assets that are ready and updated much earlier in the release cycle, 
so load testing can *shift left*  and you get feedback sooner, and release sooner.

* No correlation, No stale-capture mistakes, No weird web IDEs, No weird scripting languages, 
No weird DSLs, No weird test frameworks

If you're using browser tests, use your page objects if you have them.

BrowserUp's instrumented containers will collect all your performance stats without someone having to dig into the intricate, 
continually changing, request patterns of your app as you go from release to release.

Your load tests will be *more* accurate, because you're using the thing that normally speaks to your app to drive the load.

We publish data for data-driven testing as well as things like think time into the container
via environment variables.

Oh, and one more thing
* Integrated front-end Core Web Vitals metrics from your *existing tests*, with no extra work on your part.


## Installation

## Prerequisites


npm install -g browserup



## Documentation

### Linking

To manually link the browserup command to the ./bin/browserup.mjs file, run:

```bash
npm link
```

### Running from the command line:

```bash
./bin/browserup.mjs cluster
```

## Installing for CI/CD

SKIP_DOCKER=true npm install browserup

In a CI/CD install, there may not be a local docker.  Installing this way will skip the postinstall 
scripts to verify docker is present, and pre-pull docker images.



## Running the tests:

We use modules, so you need to pass this flag to node:
```bash
node --experimental-vm-modules
```

Running a single test:
```bash
jest -t "displays load start"
```

# Important! TESTING NOTE!

You NEED to pass --experimental-vm-modules to node, otherwise you will get this error:
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

# Packaging the CLI

To package as a standalone CLI, you can do this:
https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e
