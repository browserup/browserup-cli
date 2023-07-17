import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

// page_url = https://browserup.com/
public class BrowserUpPlaygroundPage {

    @FindBy(xpath = "//a[text()=\"Web Playground\"]")
    public WebElement WebPlaygroundLink;

    public BrowserUpPlaygroundPage(WebDriver driver) {
        PageFactory.initElements(driver, this);
    }
}
