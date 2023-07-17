import static org.junit.jupiter.api.Assertions.*;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import java.time.Duration;

public class MainPageScript {
    public static void main(String[] args) {
        if(System.getenv("CHROMEDRIVER_PATH") != null){
            System.setProperty("webdriver.chrome.driver", System.getenv("CHROMEDRIVER_PATH"));
        }

        ChromeOptions options = new ChromeOptions();
        options.addArguments("--remote-allow-origins=*", "--headless", "--no-sandbox", "--no-zygote",
                             "--disable-extensions", "--disable-dev-shm-usage", "--verbose");
        ChromeDriver driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
        driver.get("http://playground.browserup.com");
        think();
        BrowserUpPlaygroundPage browserUpPlaygroundPage = new BrowserUpPlaygroundPage(driver);
        browserUpPlaygroundPage.WebPlaygroundLink.click();
        think();
        System.out.println("Page title is: " + driver.getTitle());
        driver.close();
        driver.quit();
    }

    private static int parseToInt(String stringToParse, int defaultValue) {
        try {
            return Integer.parseInt(stringToParse);
        } catch(NumberFormatException ex) {
            return defaultValue; //Use default value if parsing failed
        }
    }
    static private void think(){
        int sleepFor = parseToInt(System.getenv("THINK_TIME" ), 10);
        int sleepForMs = sleepFor * 1000;
        try {
            System.out.println("Sleeping for " + sleepFor + " seconds");
            Thread.sleep(sleepForMs);
        }
        catch(InterruptedException e){
            System.out.println("Interrupted during sleep: " + e.getMessage());
        }
    }
}
