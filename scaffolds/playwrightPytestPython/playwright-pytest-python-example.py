import pytest
import os
import time

from playwright.sync_api import sync_playwright

@pytest.fixture(scope="function")
def browser():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path="/usr/bin/chromium")
        yield browser
        browser.close()

def test_has_title(browser):
    page = browser.new_page()
    page.goto('http://playground.browserup.com/')

    think_time = int(os.getenv('THINK_TIME') or 30)
    title = page.title()
    assert "Playground" in title, f"Expected 'Playground' in title, but found '{title}'"
    time.sleep(think_time)
