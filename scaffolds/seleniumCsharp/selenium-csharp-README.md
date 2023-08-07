This project uses Selenium. Note that it does *not* use the NuGet package.
The NuGet package works by copying the chromedriver into the project.
That approach works, but it isn't cross-platform.

The browserup/standard container has /user/bin/chromium and /usr/bin/chromedriver already installed.

Your local install should have these items installed and available on the PATH.

# Building:

 Before you can use this example for a test, you must build it:

 ```
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