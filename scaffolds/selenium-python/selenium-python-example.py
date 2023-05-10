#!/usr/bin/env python3

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
options = Options()

options.add_argument('--no-sandbox')
options.add_argument('--no-zygote')
options.add_argument("--disable-extensions")
options.add_argument('--headless')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--verbose')
#options.add_argument('--window-size=1400,1400')

driver = webdriver.Chrome(options=options)
driver.get("http://www.browserup.com")
print(driver.title)
assert "BrowserUp" in driver.title
driver.close()
