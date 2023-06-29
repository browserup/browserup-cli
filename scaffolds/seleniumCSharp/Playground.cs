
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using System.Diagnostics;

class Playground
{

    static void Main(string[] args)
    {
        IWebDriver driver = new ChromeDriver();
        driver.Url = "http://playground.browserup.com";

        string? think = Environment.GetEnvironmentVariable("think_time");
        int sleepTime = (think != null) ? int.Parse(think) : 10000;

        Thread.Sleep(sleepTime);
        driver.FindElement(By.LinkText("Web Playground")).Click();

        Thread.Sleep(sleepTime);
        Trace.Assert(driver.PageSource.Contains("Toys"));
    }
}