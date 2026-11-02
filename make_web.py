#!/usr/bin/env python3
"""把 Kling 影片轉成網頁用的檔案，輸出到 site/assets/。

用 .venv 執行（內含 ffmpeg）：
  .venv/bin/python make_web.py
"""
import subprocess
import os
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "site", "assets")

INTRO_SRC = "kling_20261102_VIDEO_Locked_off_4007_0.mp4"
HERO_SRC = "kling_20261102_VIDEO_Slow_gentl_4068_0.mp4"

INTRO_SPEED = 1.25    # 3.04s -> 約 2.4s，接近 demo 的 2.3s
HERO_XFADE = 0.8      # 循環接縫的交叉淡化秒數

# 網頁通用 H.264：yuv420p、無音軌、moov 前置讓手機邊下載邊播
# level 鎖 4.0：沒鎖時加速後的不規則時間軸會被判成 level 6.2，iPhone Safari 直接拒播
ENCODE = ["-c:v", "libx264", "-preset", "slow", "-crf", "22", "-profile:v", "high",
          "-level:v", "4.0", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an"]


def run(args):
    subprocess.run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", *args], check=True, cwd=HERE)


def duration(src):
    import cv2
    c = cv2.VideoCapture(os.path.join(HERE, src))
    return c.get(cv2.CAP_PROP_FRAME_COUNT) / c.get(cv2.CAP_PROP_FPS)


def main():
    os.makedirs(OUT, exist_ok=True)

    # 開場：整段加速，不裁頭，首幀才會和 poster 完全一致
    intro, hero = os.path.join(OUT, "intro.mp4"), os.path.join(OUT, "hero.mp4")
    # 加速後補 fps=30，輸出固定幀率
    run(["-i", INTRO_SRC, "-vf", f"setpts=PTS/{INTRO_SPEED},fps=30", *ENCODE, intro])
    # poster 取轉檔後的第一格，色彩與影片一致，切換時不會跳
    run(["-i", intro, "-frames:v", "1", "-q:v", "3", os.path.join(OUT, "intro-poster.jpg")])

    # 主視覺：尾段與開頭交叉淡化，最後一格接回第一格無縫
    L = duration(HERO_SRC)
    x = HERO_XFADE
    offset = (L - x) - x
    fc = (f"[0:v]split[a][b];"
          f"[a]trim=start={x},setpts=PTS-STARTPTS,fps=24[a1];"
          f"[b]trim=end={x},setpts=PTS-STARTPTS,fps=24[b1];"
          f"[a1][b1]xfade=transition=fade:duration={x}:offset={offset:.3f},format=yuv420p[v]")
    run(["-i", HERO_SRC, "-filter_complex", fc, "-map", "[v]", *ENCODE, hero])
    run(["-i", hero, "-frames:v", "1", "-q:v", "3", os.path.join(OUT, "hero-poster.jpg")])

    for f in ("intro.mp4", "intro-poster.jpg", "hero.mp4", "hero-poster.jpg"):
        print(f"{f:20s} {os.path.getsize(os.path.join(OUT, f)) / 1024:8.0f} KB")


if __name__ == "__main__":
    main()
