
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using System.Diagnostics;

class SeleniumCSharpExample
{

    static void Main(string[] args)
    {
        string? think = Environment.GetEnvironmentVariable("think_time");
        int sleepTime = (think != null) ? int.Parse(think) : 10000;

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
        Thread.Sleep(sleepTime);

        Trace.Assert(driver.PageSource.Contains("Toys"));

        driver.Close();
        driver.Quit();
    }
}