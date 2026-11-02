#!/usr/bin/env python3
"""用 OpenAI gpt-image-2 產生圖片。Key 從 ~/.openai_key 讀取，不會印出。

用法：
  python3 gen_image.py prompts/first_frame.txt out/first_v1.png --size 1088x1920 --quality medium
  # 改圖（帶 --image 就改走 edits 端點）
  python3 gen_image.py prompts/last_frame.txt out/last_v1.png --image out/first_v1.png --size 1088x1920
"""
import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
import uuid

API_URL = "https://api.openai.com/v1/images/generations"
EDIT_URL = "https://api.openai.com/v1/images/edits"
# 官方定價（每百萬 token, USD）；用來估算單次花費
PRICE_INPUT = 4.00
PRICE_OUTPUT = 15.00


def main():
    p = argparse.ArgumentParser()
    p.add_argument("prompt_file")
    p.add_argument("out_path")
    p.add_argument("--size", default="1024x1536")
    p.add_argument("--quality", default="medium", choices=["low", "medium", "high"])
    p.add_argument("--model", default="gpt-image-2")
    p.add_argument("--image", help="要修改的原圖；有給就走 edits 端點")
    args = p.parse_args()

    with open(os.path.expanduser("~/.openai_key")) as f:
        key = f.read().strip()
    with open(args.prompt_file, encoding="utf-8") as f:
        prompt = f.read().strip()

    fields = {
        "model": args.model,
        "prompt": prompt,
        "size": args.size,
        "quality": args.quality,
        "n": "1",
    }
    if args.image:
        body, content_type = multipart(fields, "image", args.image)
        url = EDIT_URL
    else:
        body, content_type = json.dumps({**fields, "n": 1}).encode(), "application/json"
        url = API_URL
    req = urllib.request.Request(url, data=body, headers={
        "Authorization": f"Bearer {key}",
        "Content-Type": content_type,
    })
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode(errors='replace')}", file=sys.stderr)
        sys.exit(1)

    os.makedirs(os.path.dirname(os.path.abspath(args.out_path)), exist_ok=True)
    with open(args.out_path, "wb") as f:
        f.write(base64.b64decode(data["data"][0]["b64_json"]))

    usage = data.get("usage") or {}
    cost = (usage.get("input_tokens", 0) * PRICE_INPUT
            + usage.get("output_tokens", 0) * PRICE_OUTPUT) / 1e6
    print(f"saved {args.out_path}")
    print(f"usage {json.dumps(usage)}")
    print(f"est_cost_usd {cost:.4f}")


def multipart(fields, file_field, file_path):
    boundary = uuid.uuid4().hex
    parts = []
    for k, v in fields.items():
        parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    with open(file_path, "rb") as f:
        data = f.read()
    name = os.path.basename(file_path)
    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="{file_field}"; filename="{name}"\r\n'
        f"Content-Type: image/png\r\n\r\n".encode() + data + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    return b"".join(parts), f"multipart/form-data; boundary={boundary}"


if __name__ == "__main__":
    main()
