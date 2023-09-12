import os
import time
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(executable_path="/usr/bin/chromium")
    page = browser.new_page()
    page.goto("http://playground.browserup.com/")
    think_time = int(os.getenv('THINK_TIME') or 30)
    print(page.inner_html("*"))
    time.sleep(think_time)
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
