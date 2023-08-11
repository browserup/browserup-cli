from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(executable_path="/usr/bin/chromium")
    page = browser.new_page()
    page.goto("http://playground.browserup.com/")

    print(page.inner_html("*"))
    # other actions...
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
