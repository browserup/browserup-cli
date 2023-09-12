#!/usr/bin/env python3

import httpx
import time
import os

think_time = int(os.environ.get("THINK_TIME", 10))

httpx.get("https://www.example.org/")
time.sleep(think_time)
