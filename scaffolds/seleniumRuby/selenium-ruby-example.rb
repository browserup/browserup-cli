#!/usr/bin/env ruby

require "capybara"
require "selenium-webdriver"

think_time = ENV['THINK_TIME'].to_i || 30

args = %w[--no-sandbox --no-zygote --headless --disable-dev-shm-usage]
options = ::Selenium::WebDriver::Chrome::Options.new(args: args)
session = Capybara::Selenium::Driver.new(nil, browser: :chrome, options: options)
session.visit("http://playground.browserup.com")
puts session.html

sleep(think_time)

session.visit "http://playground.browserup.com/websocket/rooms/1"

sleep(think_time)

session.visit "http://playground.browserup.com/streaming-video.html"

sleep(think_time)

session.quit
