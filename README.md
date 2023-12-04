<p/>

<div align="">
  <img src="https://browserup.com/wp-content/themes/browserup/images/logo-text-475x93.png" alt="BrowserUp" width="200px" />
</div>

<h3 align="">Load Testing for Engineers</h3>

----

Use your existing code to power your load tests, so you **d**on't **r**epeat **y**ourself.
<br>
<div align="">
  <table class="">
  <tr><th colspan="2">Load test with your own:</th></tr>
  <tr><td><b>Playwright</b> </td><td>Javascript, Python, C#, etc (Page objects, too)</td></tr>
  <tr><td><b>Selenium</b></td><td>JavaScript, Java, Python, Ruby, C#(Page objects, too)</td></tr>
  <tr><td><b>PostMan</b></td><td>Using Newman command line runner</td></tr>
  <tr><td><b>A REST API client</b></td><td>Use your own libraries/language</td></tr>
  <tr><td><b>Curl</b></td><td>If it makes requests, it can be a load test!</td></tr>
  <tr><td><b>A Mobile App or IOT App</b></td><td>Run it, let requests happen naturally</td></tr>
  </table>
</div>
<p/>
These items have easy, out-of-the box, support, but you can create a custom image with
almost anything that you want--any language, framework, etc!

See our [Documentation](https://browserup.com/docs) for more details.

----

Differences between BrowserUp and other tools:

* BrowserUp runs _your_ *asset* and code libraries.
* Because this isn't an _import_ it doesn't create a second implementation to maintain in a script for HTTP, or in some other
  language.
* No correlation, No stale-capture mistakes, No weird web IDEs, No weird scripting languages,
  No weird DSLs, No bespoke test framework to learn.
* Your code repo becomes the source of truth.
* If you're using browser tests, use your page objects. As soon as they are ready, so is your load test.
* If you're using API tests, use your programmatic REST client, or PostMan. As soon as it is ready, so is your load test.
* By using assets created early in the release cycle, load testing **shifts left**. Faster feedback means you release sooner.

BrowserUp's instrumented containers collect your performance stats for you, without a separate load test scripting step.

----
### Oh, One More Thing:

For *any* browser-based test, get **Core Web Vitals** metrics from your *existing tests*, with no extra code or work.

----

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
* Mac Arm64 (M1/M2/M3) or Linux AMD64 or Windows 10+
* 32 GB Ram or more Recommended
* 8 CPU Cores or more Recommended

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

### Summary of the licensing for BrowserUp

#### Free For
* Non-commercial use, personal use, education, and non-commercial open source projects.
* Commercial use at companies with less than 10 million in revenue and fewer than 250 employees
* Commercial use at companies with more than 10 million in revenue or more than 250 employees, but only for 30 days from date of
  first installation.

See [BrowserUp.com](https://browserup.com) for details.

----

<p align="">
  <a href="http://browserup.com/docs">Documentation</a> | <a href="https://twitter.com/browserup">@browserup</a> | <a 
href="https://github.com/browserup/browserup-cli/discussions">Questions?</a>
</p>

