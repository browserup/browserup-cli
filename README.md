<br>
<img src="https://browserup.com/wp-content/themes/browserup/images/logo-text-475x93.png" alt="BrowserUp" width="200px" />

BrowserUp is a load testing tool that uses your existing code to drive load.

The idea is simple--most companies maintain multiple implementations of "how to talk" to your app.
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
* A Mobile App or IOT App
* Some code you wrote in *whatever*

See our [Documentation](https://browserup.github.io/docs/en/load/quick-start) for more details.

Key differences between BrowserUp and other load testing tools:

* BrowserUp actually runs _your_ *asset* and code libraries. The artifact folder and anything below is copied into the container.
* Because this isn't an _import_ it doesn't create a second implementation to maintain in a script for HTTP, or in some other
  language.
* No correlation, No stale-capture mistakes, No weird web IDEs, No weird scripting languages, 
No weird DSLs, No weird test frameworks
* Your code repo becomes the source of truth.
* If you're using browser tests, use your page objects. As soon as they are ready, so is your load test.
* By using assets that are ready earlier in the release cycle, load testing can **shift left** and give feedback sooner so you release sooner. 

BrowserUp's instrumented containers collect your performance stats without someone having to dig into the intricate, 
continually changing, request patterns of your app as you go from version to version.  Your load tests will be *more* accurate.

Oh, and One More Thing:

For *any* browser-based test, **Core Web Vitals** metrics from your *existing tests*, with no extra code or work.

## Installation
```bash
npm install -g browserup

# prepare the local Docker environment by fetching images
browserup cluster install 
```

For installations where the local cluster is not used, like CI/CD, you can skip `browserup cluster install`

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

### Help

For help, run any command with -h

Or,  Join us in [Slack](https://join.slack.com/t/browserup-community/shared_invite/zt-1zddvbu5f-_wZtMuANHgFaz9YstEspLw)


## Licensing

This NPM package is the command-line interface for BrowserUp. This package is AGPL-3.0 licensed, but licensing for BrowserUp 
itself is handled separately, with a separate license and terms.
