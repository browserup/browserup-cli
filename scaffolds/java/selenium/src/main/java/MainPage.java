import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

// page_url = https://browserup.com/
public class MainPage {

    @FindBy(xpath = "//a[text()=\"Privacy\"]")
    public WebElement privacyPolicyLink;


    public MainPage(WebDriver driver) {
        PageFactory.initElements(driver, this);
    }
}
