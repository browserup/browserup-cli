#!/usr/bin/env ruby

require "capybara"
require "selenium-webdriver"

args = %w[--no-sandbox --no-zygote --headless --disable-dev-shm-usage]
options = ::Selenium::WebDriver::Chrome::Options.new(args: args)
session = Capybara::Selenium::Driver.new(nil, browser: :chrome, options: options)
session.visit("http://playground.browserup.com")
puts session.html
session.quit
