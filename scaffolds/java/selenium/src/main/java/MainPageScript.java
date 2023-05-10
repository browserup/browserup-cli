import static org.junit.jupiter.api.Assertions.*;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import java.time.Duration;

public class MainPageScript {
    public static void main(String[] args) {
        // WebDriverManager downloads chrome browser executables or binaries.
        // Create an object of Chrome Options class
        ChromeOptions options = new ChromeOptions();

        options.addArguments("--no-sandbox");
        options.addArguments("--headless");

        ChromeDriver driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
        driver.get("https://browserup.com/");

        MainPage  mainPage = new MainPage(driver);
        mainPage.privacyPolicyLink.click();
        think();
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
            Thread.sleep(sleepForMs);
        }
        catch(InterruptedException e){
            System.out.println("Interrupted during sleep: " + e.getMessage());
        }
    }
}
