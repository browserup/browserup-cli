# BrowserUp

The [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) Load Testing Tool

## What is BrowserUp?

BrowserUp is a new approach to load testing. The idea is simple--if you are like
most companies, you maintain multiple implementations of "how to talk" to your app.
We think that's a waste of time, and a source of bugs.

BrowserUp lets you take *anything* that drives traffic, and you can 
use _that_ to drive load for a load test.

BrowserUp uses a unique model of scaling instrumented containers to drive load.
You can take any asset that can be run in a container, and use it to drive load.

Use your own libraries, your own scripts, your own code, your own tests, your own
clients, your own mobile apps, your own IOT code, your own streaming video.

You can drive load for a BrowserUp load test with:
* Playwright
* Selenium scripts (JavaScript, Java, Python, )
* PostMan
* A REST API client in any language
* Curl
* A mobile app
* An IOT App
* Streaming video
* Some random code you wrote yourself in *any* language

There are a few key differences between BrowserUp and other load testing tools:

* Because this isn't an _import_ it doesn't createa a second implementation to maintain--we actually run your *asset* you won't repeat yourself maintaining
a separate load test implementation.
* Because it runs your code, it doesn't matter what language you use. You can use any language you want.
* Because it runs your code, you can use your own code libraries.
* Your repo is the source of truth.
* Most importantly, it lets you use assets that are ready and updated much earlier in the release cycle, 
so you can finally shift left * your load testing and release much sooner.
* No correlation
* No stale-capture headaches
* No weird web IDE

If you're using browser-tests, then you can use your page objects if you have them.

If you're testing an API, you can use your API client. If you're testing a mobile app,
you can use your mobile app.

BrowserUp's instrumented containers will collect all your performance stats without someone having to dig into the intricate, 
continually changing, request patterns of your app as you go from release to release.

On top of this, your load tests will be *more* accurate, because you're using the same
thing that normally speaks to your app to drive the load.

We publish data for data-driven testing as well as things like think time into the container
via environment variables.


## Installation

## Prerequisites


npm install -g browserup



## Documentation






Running from the command line:

```bash
./bin/browserup.mjs cluster
```

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

Packaging the CLI

https://medium.com/netscape/a-guide-to-create-a-nodejs-command-line-package-c2166ad0452e
