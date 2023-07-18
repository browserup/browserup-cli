<img src="https://browserup.com/wp-content/themes/browserup/images/logo-text-475x93.png" alt="BrowserUp" style="width: 200px;  margin-top: 25px;" />

<<<<<<< HEAD
##  BrowserUp Command Line Interface (CLI)

This package installs BrowserUp and uses it to manage load tests.

=======
>>>>>>> 7c6c20e3 (Version bump, update readme)
### What is BrowserUp?

BrowserUp is a suite of tools that offer a new approach to testing. Our first tool is 
a load testing tool that uses your existing assets to drive load.

The idea is simple--most companies, maintain multiple implementations of "how to talk" to your app.
We think that's a waste of time and a source of bugs. **D**on't **R**epeat **Y**ourself. 
BrowserUp uses *your* stuff, your code, written in your IDE, to drive load.

BrowserUp takes *anything* that drives traffic, and uses _that_ to create traffic
using a unique *instrumented container* approach to scaling load.

A few examples of how you can drive load for a BrowserUp load test--use your own:
* Playwright (Javascript, Python, C#, etc) 
* Selenium scripts (JavaScript, Java, Python, Ruby, C#)
* PostMan
* A REST API client in any language
* Curl
* A Mobile App
* An IOT App
* Some code you wrote in *whatever* language

See our [Documentation](https://browserup.github.io/docs/en/load/quick-start) for more details.

There are a few key differences between BrowserUp and other load testing tools:

* Because this isn't an _import_ it doesn't create a second implementation to maintain in a script for HTTP, or in some other
language.
* BrowserUp actually runs _your_ *asset* and code libraries. The artifact folder and anything below is copied into the container.
* No correlation, No stale-capture mistakes, No weird web IDEs, No weird scripting languages, 
No weird DSLs, No weird test frameworks
* Your code repo becomes the source of truth.
* If you're using browser tests, use your page objects as soon as they are ready, so is your load test.
* By using assets that are ready earlier in the release cycle, load testing can **shift left** and give feedback sooner so you release sooner. 

BrowserUp's instrumented containers collect all your performance stats without someone having to dig into the intricate, 
continually changing, request patterns of your app as you go from version to version.  Your load tests will be *more* accurate.

Oh, and One More Thing:

For *any* browser-based test **Core Web Vitals** metrics from your *existing tests*, with no extra code or work.


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


## Licensing

This NPM package is the command-line interface for BrowserUp.

The command-line interface is AGPL-3.0 licensed, but licensing for BrowserUp itself is handled separately, 
with a separate license and terms.
