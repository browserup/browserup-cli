#!/usr/bin/env ruby

require "typhoeus"

response = Typhoeus.get("https://cloudflare-quic.com/")
puts response.code
m = response.response_body.match(/browser used <strong>HTTP\/([0-9])<\/strong/)
puts "Your request used HTTP/#{m[1]}"
sleep ENV["THINK_TIME"].to_i
