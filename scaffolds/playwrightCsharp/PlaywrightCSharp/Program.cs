using Microsoft.Playwright;

using var playwright = await Playwright.CreateAsync();

string? browserPath = Environment.GetEnvironmentVariable("CHROME_PATH");
BrowserTypeLaunchOptions options = new BrowserTypeLaunchOptions { Headless = true };

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
// other actions
await chromium.CloseAsync();
