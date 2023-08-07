This project uses Selenium. 

Note that it does *not* use the NuGet package. 
The NuGet package works by copying the chromedriver into the project. 
That approach works, but it isn't cross-platform, and a goal for browserup is to be able to work across platforms.

Although it is possible to not run your tests locally, and create a setup that only runs within the browserup containers,
these instructions are oriented toward a setup which works both locally and in the browserup containers on the 
assumption that you will be building and compiling locally, and then running the same code in the browserup containers.

The browserup/standard container, which is build on debian, 
has /user/bin/chromium and /usr/bin/chromedriver already installed.

Requirements:
* chromium installed and on the PATH (for local testing)
* chromedriver installed and on the PATH (for local testing)
* dotnet 7.0 or later
* BrowserUP installed
* Docker for local testing / verification

To create a solution that works both locally, and 
in BrowserUp, your local install should have chromium and chromedriver installed and available on the PATH.


# Building:

Before you can use this example for a test, you must build it. 

 ```
 cd seleniumCsharp
 dotnet build --configuration Release
 ```

# Verifying

From the top-level folder, run:

browserup load verify -k -v -i standard-base:latest "dotnet ./bin/Release/net7.0/csharp-example.dll"

this should print a HAR (traffic capture) and something like:

The traffic capture (HAR) is valid, number of captured entries: 11
GET: http://playground.browserup.com/
GET: http://playground.browserup.com/html.png
GET: http://playground.browserup.com/websockets.png
GET: http://playground.browserup.com/grpc.png
GET: http://playground.browserup.com/api.png
GET: http://playground.browserup.com/graphql.png
GET: http://playground.browserup.com/streaming-video.png
GET: http://playground.browserup.com/html.png
GET: http://playground.browserup.com/web/toys


# Running:

This example should be accompanied by a browserup.load.yaml file. In it, a profile is defined
which points to the generated dll.


  profiles:
    - name: "CSharpExample"
      command: "dotnet ./bin/Release/net7.0/csharp-example.dll"
      think_time: "30s"
      artifact_dir: "."
      iteration_delay: "10s"
      allocation: "100%"

To start the test defined in browserup.load.yaml, run:

```
browserup load start
```
