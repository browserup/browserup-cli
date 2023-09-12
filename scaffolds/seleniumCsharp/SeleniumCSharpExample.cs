
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using System.Diagnostics;

class SeleniumCSharpExample
{

    static void Main(string[] args)
    {
        int thinkTime = int.TryParse(Environment.GetEnvironmentVariable("THINK_TIME"), out thinkTime) ? thinkTime : 30;
        int thinkTimeMs = thinkTime * 1000;

        var options = new ChromeOptions();
        options.AddArgument("--headless");
        options.AddArgument("--no-sandbox");
        options.AddArgument("--disable-extensions");
        options.AddArgument("--verbose");

        var service = ChromeDriverService.CreateDefaultService();
        service.LogPath = "/tmp/log.txt";
        service.EnableVerboseLogging = true;
        IWebDriver driver = new ChromeDriver(service, options );
        
        driver.Url = "http://playground.browserup.com";
        Thread.Sleep(sleepTime);

        driver.FindElement(By.LinkText("Web Playground")).Click();
        Thread.Sleep(thinkTimeMs);

        Trace.Assert(driver.PageSource.Contains("Toys"));

        driver.Close();
        driver.Quit();
    }
}
