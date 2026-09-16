#!/usr/bin/env python3
"""Ping IndexNow (Bing, Yandex, Seznam, Naver) that pages have changed.

Run after deploying. With no arguments it submits the whole site; pass URLs to
submit only those. The key file must already be live at the keyLocation below,
or the endpoint returns 422 and ignores the submission.

    python indexnow-submit.py
    python indexnow-submit.py https://wireddentistry.com/subscribe/
"""
import json
import sys
import urllib.error
import urllib.request

HOST = "wireddentistry.com"
KEY = "3d045d3e4fd072ed596d565ab908bd27"
DEFAULT_URLS = [
    f"https://{HOST}/",
    f"https://{HOST}/subscribe/",
]

def main():
    urls = sys.argv[1:] or DEFAULT_URLS
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": f"https://{HOST}/{KEY}.txt",
        "urlList": urls,
    }
    req = urllib.request.Request(
        "https://api.indexnow.org/IndexNow",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            code = r.status
    except urllib.error.HTTPError as e:
        code = e.code

    # 200 accepted, 202 accepted but key still being verified.
    meaning = {
        200: "accepted",
        202: "accepted - key pending validation",
        400: "bad request - malformed payload",
        403: "key not valid for this host",
        422: "URLs do not match the host, or the key file could not be read",
        429: "too many requests - slow down",
    }.get(code, "unexpected response")
    print(f"HTTP {code} - {meaning}")
    for u in urls:
        print("  submitted:", u)
    return 0 if code in (200, 202) else 1

if __name__ == "__main__":
    raise SystemExit(main())
