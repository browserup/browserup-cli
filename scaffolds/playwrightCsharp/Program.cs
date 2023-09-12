using Microsoft.Playwright;
using var playwright = await Playwright.CreateAsync();
using System.Threading;

string? browserPath = Environment.GetEnvironmentVariable("CHROME_PATH");
BrowserTypeLaunchOptions options = new BrowserTypeLaunchOptions { Headless = true };

int thinkTime = int.TryParse(Environment.GetEnvironmentVariable("THINK_TIME"), out thinkTime) ? thinkTime : 30;
int thinkTimeMs = thinkTime * 1000;

if (!string.IsNullOrEmpty(browserPath))
{
    Console.WriteLine(browserPath);
    options.ExecutablePath = browserPath;
}
else
{
    Console.WriteLine("browserPath not set!");
}
var chromium = await playwright.Chromium.LaunchAsync(options);
var page = await chromium.NewPageAsync();

await page.GotoAsync("http://playground.browserup.com");
Console.WriteLine(await page.TitleAsync());

Thread.Sleep(thinkTimeMs);

await chromium.CloseAsync();
