#!/usr/bin/env python3
"""Generate Web Story art for SwasthX: per-story poster (720x960), three
page-art images (720x1280), og image (1200x675) and the publisher logo
(512x512 PNG). All art is drawn programmatically in the site's Warm
Editorial palette (ivory #FAF6EE, terracotta #C05621, marigold #B45309,
ink #1C1917) — motif shapes only, no title text, no medical imagery,
no green.

Run LOCALLY and commit the output under public/stories/ — Vercel's build
image has no Python PIL, so art must never be generated at build time.

Usage: gen-story-images.py <manifest.json> <outDir>
manifest: [{"slug": "...", "motif": "...", "glyph": "..."}]
outDir is the public/ directory; files land in <outDir>/stories/<slug>/.
"""
import json, math, sys, random, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

IVORY = (250, 246, 238)
PAPER_D = (242, 233, 214)
GLOWC = (252, 243, 224)
TERRA = (192, 86, 33)
TERRA_D = (156, 66, 24)
CLAY = (216, 122, 72)
MARI = (180, 83, 9)
SAND = (226, 207, 168)
LINEC = (199, 181, 142)
INK = (28, 25, 23)

SERIF = "/usr/share/fonts/truetype/noto/NotoSerifDevanagari-Bold.ttf"
S = 2  # supersample


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def base(w, h, seed=0):
    """Ivory paper gradient with soft glow + double hairline frame + dots."""
    img = Image.new("RGB", (w * S, h * S), IVORY)
    d = ImageDraw.Draw(img, "RGBA")
    W, H = w * S, h * S
    for y in range(0, H, 6):
        d.line([(0, y), (W, y)], fill=lerp(IVORY, PAPER_D, y / H) + (255,), width=6)
    glow = Image.new("L", (W, H), 0)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W * 0.5 - W * 0.55, H * 0.30 - W * 0.55, W * 0.5 + W * 0.55, H * 0.30 + W * 0.55], fill=120)
    glow = glow.filter(ImageFilter.GaussianBlur(120 * S // 2))
    img = Image.composite(Image.new("RGB", (W, H), GLOWC), img, glow)
    d = ImageDraw.Draw(img, "RGBA")
    m1, m2 = 16 * S, 24 * S
    d.rectangle([m1, m1, W - m1, H - m1], outline=TERRA + (110,), width=2 * S)
    d.rectangle([m2, m2, W - m2, H - m2], outline=LINEC + (150,), width=1 * S)
    for cx, cy in [(44, 44), (w - 44, 44), (44, h - 44), (w - 44, h - 44)]:
        d.ellipse([(cx - 5) * S, (cy - 5) * S, (cx + 5) * S, (cy + 5) * S], fill=MARI + (200,))
    for i in range(26):
        x = (40 + i * (w - 80) / 25) * S
        y = (h - 52 - (10 if i % 2 else 0)) * S
        r = (3.2 if i % 2 else 2.2) * S
        d.ellipse([x - r, y - r, x + r, y + r], fill=TERRA + (80,))
    return img, d


def ring_dots(d, cx, cy, r, n, dot, color=TERRA, alpha=150):
    for i in range(n):
        a = 2 * math.pi * i / n - math.pi / 2
        x, y = cx + r * math.cos(a), cy + r * math.sin(a)
        d.ellipse([x - dot, y - dot, x + dot, y + dot], fill=color + (alpha,))


def star4(d, x, y, r, color, alpha=220):
    d.polygon([(x, y - r), (x + r * 0.3, y - r * 0.3), (x + r, y), (x + r * 0.3, y + r * 0.3),
               (x, y + r), (x - r * 0.3, y + r * 0.3), (x - r, y), (x - r * 0.3, y - r * 0.3)], fill=color + (alpha,))


def teardrop_pts(cx, cy, s, fullness=0.42, taper=140):
    pts = []
    for t in range(0, 101):
        a = t / 100 * math.pi
        x = cx + math.sin(a) * fullness * s * (1 - t / taper)
        y = cy + s * 0.72 - t / 100 * s * 1.72
        pts.append((x, y))
    for t in range(100, -1, -1):
        a = t / 100 * math.pi
        x = cx - math.sin(a) * fullness * s * (1 - t / taper)
        y = cy + s * 0.72 - t / 100 * s * 1.72
        pts.append((x, y))
    return pts


# ---------- motif painters: (d, W, H, k, cx, cy) in supersampled px ----------

def m_sun(d, W, H, k, cx, cy):
    for i in range(12):
        a = 2 * math.pi * i / 12
        x1, y1 = cx + math.cos(a) * 100 * k, cy + math.sin(a) * 100 * k
        x2, y2 = cx + math.cos(a) * (142 if i % 2 else 126) * k, cy + math.sin(a) * (142 if i % 2 else 126) * k
        d.line([x1, y1, x2, y2], fill=TERRA + (235,), width=int(7 * k))
    d.ellipse([cx - 82 * k, cy - 82 * k, cx + 82 * k, cy + 82 * k], fill=MARI + (255,))
    d.ellipse([cx - 60 * k, cy - 60 * k, cx + 60 * k, cy + 60 * k], outline=IVORY + (220,), width=int(4 * k))
    d.ellipse([cx - 20 * k, cy - 20 * k, cx + 20 * k, cy + 20 * k], fill=TERRA + (255,))
    ring_dots(d, cx, cy, 178 * k, 18, 3.4 * k, MARI, 130)


def m_moon(d, W, H, k, cx, cy):
    R = 130 * k
    d.arc([cx - R, cy - R, cx + R, cy + R], 55, 305, fill=MARI + (255,), width=int(46 * k))
    for i, (dx, dy, r) in enumerate([(-0.95, -0.75, 13), (0.85, -1.0, 10), (1.15, 0.25, 12), (-1.2, 0.5, 9), (0.55, 0.95, 8)]):
        star4(d, cx + dx * R * 1.25, cy + dy * R * 1.1, r * k, TERRA if i % 2 else CLAY)
    ring_dots(d, cx, cy, R * 1.5, 16, 3 * k, TERRA, 100)


def leaf_pts(cx, cy, length, width):
    pts = []
    for t in range(0, 101):
        tt = t / 100
        y = cy + (0.5 - tt) * length
        hw = math.sin(math.pi * tt) * width / 2
        pts.append((cx + hw, y))
    for t in range(100, -1, -1):
        tt = t / 100
        y = cy + (0.5 - tt) * length
        hw = math.sin(math.pi * tt) * width / 2
        pts.append((cx - hw, y))
    return pts


def m_leaf(d, W, H, k, cx, cy):
    d.polygon(leaf_pts(cx, cy, 300 * k, 150 * k), fill=TERRA + (255,))
    d.line([cx, cy + 128 * k, cx, cy - 118 * k], fill=IVORY + (235,), width=int(7 * k))
    for i, tt in enumerate([0.3, 0.48, 0.66]):
        y = cy + (0.5 - tt) * 300 * k
        hw = math.sin(math.pi * tt) * 62 * k
        d.line([cx, y, cx + hw, y - 16 * k], fill=IVORY + (150,), width=int(4 * k))
        d.line([cx, y, cx - hw, y - 16 * k], fill=IVORY + (150,), width=int(4 * k))
    d.line([cx, cy + 148 * k, cx, cy + 178 * k], fill=MARI + (255,), width=int(7 * k))
    ring_dots(d, cx, cy, 205 * k, 20, 3.2 * k, MARI, 120)


def m_drop(d, W, H, k, cx, cy):
    s = 165 * k
    d.polygon(teardrop_pts(cx, cy, s), fill=TERRA + (255,))
    d.ellipse([cx - 0.34 * s, cy + 0.16 * s, cx - 0.10 * s, cy + 0.46 * s], fill=IVORY + (120,))
    ring_dots(d, cx, cy, 218 * k, 22, 3.4 * k, MARI, 130)
    d.ellipse([cx - 218 * k, cy + 196 * k, cx + 218 * k, cy + 224 * k], outline=TERRA + (90,), width=int(3 * k))


def m_flame(d, W, H, k, cx, cy):
    d.pieslice([cx - 120 * k, cy + 62 * k, cx + 120 * k, cy + 128 * k], 0, 180, fill=TERRA_D + (255,))
    d.rectangle([cx - 120 * k, cy + 88 * k, cx + 120 * k, cy + 98 * k], fill=TERRA_D + (255,))
    d.polygon(teardrop_pts(cx, cy - 30 * k, 120 * k, 0.36, 125), fill=MARI + (255,))
    d.polygon(teardrop_pts(cx, cy + 8 * k, 62 * k, 0.36, 125), fill=CLAY + (255,))
    ring_dots(d, cx, cy - 10 * k, 195 * k, 20, 3.2 * k, TERRA, 120)


def m_rings(d, W, H, k, cx, cy):
    for i, r in enumerate([148, 112, 78, 46]):
        d.ellipse([cx - r * k, cy - r * k, cx + r * k, cy + r * k], outline=(TERRA if i % 2 == 0 else MARI) + (230,), width=int(5 * k))
    d.ellipse([cx - 15 * k, cy - 15 * k, cx + 15 * k, cy + 15 * k], fill=TERRA + (255,))
    ring_dots(d, cx, cy, 148 * k, 12, 4 * k, MARI, 180)
    ring_dots(d, cx, cy, 78 * k, 8, 3.4 * k, TERRA, 160)


def m_balloon(d, W, H, k, cx, cy):
    R = 128 * k
    d.ellipse([cx - R, cy - R, cx + R, cy + R], outline=TERRA + (255,), width=int(6 * k))
    d.arc([cx - R * 0.8, cy - R * 0.8, cx + R * 0.35, cy + R * 0.35], 130, 235, fill=CLAY + (200,), width=int(7 * k))
    rnd = random.Random(5)
    for i in range(14):
        a = rnd.uniform(0, 2 * math.pi)
        rr = rnd.uniform(0.15, 0.72) * R
        x, y = cx + math.cos(a) * rr, cy + math.sin(a) * rr
        r = rnd.uniform(6, 15) * k
        d.ellipse([x - r, y - r, x + r, y + r], outline=MARI + (170,), width=int(3 * k))
    ring_dots(d, cx, cy, R * 1.38, 18, 3 * k, MARI, 110)


def m_cup(d, W, H, k, cx, cy):
    tw, bw, th = 150 * k, 112 * k, 150 * k
    top, bot = cy - th / 2, cy + th / 2
    d.polygon([(cx - tw / 2, top), (cx + tw / 2, top), (cx + bw / 2, bot), (cx - bw / 2, bot)], outline=TERRA + (255,), width=int(6 * k))
    d.line([cx - tw / 2 + 8 * k, top + 34 * k, cx + tw / 2 - 8 * k, top + 34 * k], fill=MARI + (200,), width=int(5 * k))
    d.arc([cx + tw / 2 - 14 * k, top + 22 * k, cx + tw / 2 + 58 * k, top + 104 * k], -80, 90, fill=TERRA + (255,), width=int(6 * k))
    d.line([cx - tw / 2 - 26 * k, bot + 30 * k, cx + tw / 2 + 26 * k, bot + 30 * k], fill=MARI + (255,), width=int(5 * k))
    for dx in (-38, 0, 38):
        d.arc([cx + dx * k - 16 * k, top - 92 * k, cx + dx * k + 16 * k, top - 30 * k], 300, 130, fill=CLAY + (190,), width=int(5 * k))


def m_stalk(d, W, H, k, cx, cy):
    for dx, hh, col in [(-95, 215, TERRA), (0, 275, MARI), (95, 215, TERRA)]:
        x = cx + dx * k
        d.line([x, cy + hh * k, x, cy - hh * k], fill=col + (255,), width=int(5 * k))
        n = 6 if hh > 250 else 5
        for i in range(n):
            tt = i / (n - 1)
            y = cy - hh * k + 18 * k + tt * (hh * 2 - 60 * k)
            side = 1 if i % 2 == 0 else -1
            gx = x + side * 24 * k
            d.ellipse([gx - 21 * k, y - 9 * k, gx + 21 * k, y + 9 * k], fill=col + (235,))
    d.line([cx - 150 * k, cy + 232 * k, cx + 150 * k, cy + 232 * k], fill=TERRA + (140,), width=int(4 * k))


def m_strands(d, W, H, k, cx, cy):
    cols = [INK, TERRA, MARI, INK, TERRA, MARI]
    d.line([cx - 160 * k, cy - 185 * k, cx + 160 * k, cy - 185 * k], fill=INK + (200,), width=int(5 * k))
    for j in range(6):
        x0 = cx + (j - 2.5) * 56 * k
        pts = []
        for i in range(41):
            tt = i / 40
            x = x0 + math.sin(tt * 5.2 + j * 1.3) * 13 * k
            y = cy - 185 * k + tt * 370 * k
            pts.append((x, y))
        d.line(pts, fill=cols[j] + (235,), width=int(5 * k))
    ring_dots(d, cx, cy + 235 * k, 120 * k, 10, 3 * k, MARI, 120)


def m_flakes(d, W, H, k, cx, cy):
    d.arc([cx - 190 * k, cy - 230 * k, cx + 190 * k, cy + 60 * k], 20, 160, fill=TERRA + (255,), width=int(7 * k))
    rnd = random.Random(9)
    for i in range(90):
        x = cx + rnd.uniform(-165, 165) * k
        y = cy + rnd.uniform(-95, 185) * k
        r = rnd.uniform(2.5, 8) * k
        col = [MARI, CLAY, SAND, TERRA][i % 4]
        if i % 5 == 0:
            d.ellipse([x - r * 1.6, y - r * 1.6, x + r * 1.6, y + r * 1.6], outline=col + (200,), width=int(3 * k))
        else:
            d.ellipse([x - r, y - r, x + r, y + r], fill=col + (200,))


def m_plate(d, W, H, k, cx, cy):
    d.ellipse([cx - 148 * k, cy - 148 * k, cx + 148 * k, cy + 148 * k], outline=TERRA + (255,), width=int(6 * k))
    d.ellipse([cx - 122 * k, cy - 122 * k, cx + 122 * k, cy + 122 * k], outline=MARI + (160,), width=int(3 * k))
    for dx, dy in [(-58, -50), (58, -50), (0, 58)]:
        x, y = cx + dx * k, cy + dy * k
        r = 42 * k
        d.ellipse([x - r, y - r, x + r, y + r], fill=SAND + (255,))
        d.ellipse([x - r, y - r, x + r, y + r], outline=TERRA + (255,), width=int(4 * k))
        d.ellipse([x - 12 * k, y - 12 * k, x + 12 * k, y + 12 * k], fill=MARI + (220,))
    ring_dots(d, cx, cy, 182 * k, 20, 3.2 * k, TERRA, 110)


def m_pair(d, W, H, k, cx, cy):
    R = 98 * k
    for dx, col in [(-56, TERRA), (56, MARI)]:
        x = cx + dx * k
        d.ellipse([x - R, cy - R, x + R, cy + R], outline=col + (255,), width=int(6 * k))
    d.ellipse([cx - 26 * k, cy - 62 * k, cx + 26 * k, cy + 62 * k], fill=CLAY + (110,))
    d.ellipse([cx - 13 * k, cy - 13 * k, cx + 13 * k, cy + 13 * k], fill=TERRA_D + (255,))
    ring_dots(d, cx, cy, 196 * k, 20, 3.2 * k, MARI, 110)


def m_glass(d, W, H, k, cx, cy):
    tw, bw, th = 158 * k, 118 * k, 240 * k
    top, bot = cy - th / 2, cy + th / 2
    lvl = top + th * 0.42
    d.polygon([(cx - (tw - (tw - bw) * 0.42) / 2, lvl), (cx + (tw - (tw - bw) * 0.42) / 2, lvl), (cx + bw / 2, bot), (cx - bw / 2, bot)], fill=CLAY + (190,))
    d.polygon([(cx - tw / 2, top), (cx + tw / 2, top), (cx + bw / 2, bot), (cx - bw / 2, bot)], outline=TERRA + (255,), width=int(6 * k))
    rnd = random.Random(4)
    for i in range(6):
        x = cx + rnd.uniform(-0.32, 0.32) * tw
        y = lvl + rnd.uniform(0.15, 0.8) * (bot - lvl)
        r = rnd.uniform(4, 8) * k
        d.ellipse([x - r, y - r, x + r, y + r], outline=IVORY + (220,), width=int(3 * k))
    ring_dots(d, cx, cy, 205 * k, 18, 3 * k, MARI, 110)


def m_gauge(d, W, H, k, cx, cy):
    R = 155 * k
    d.arc([cx - R, cy - R, cx + R, cy + R], 180, 360, fill=TERRA + (255,), width=int(13 * k))
    for i in range(9):
        a = math.pi + i * math.pi / 8
        x1, y1 = cx + math.cos(a) * R * 0.82, cy + math.sin(a) * R * 0.82
        x2, y2 = cx + math.cos(a) * R * 0.97, cy + math.sin(a) * R * 0.97
        d.line([x1, y1, x2, y2], fill=MARI + (255,), width=int(5 * k))
    a = math.pi + 0.62 * math.pi
    d.line([cx, cy, cx + math.cos(a) * R * 0.72, cy + math.sin(a) * R * 0.72], fill=INK + (255,), width=int(8 * k))
    d.ellipse([cx - 16 * k, cy - 16 * k, cx + 16 * k, cy + 16 * k], fill=INK + (255,))
    d.line([cx - R, cy + 34 * k, cx + R, cy + 34 * k], fill=LINEC + (200,), width=int(3 * k))
    for dx in (-1, 1):
        x = cx + dx * R * 0.8
        d.ellipse([x - 9 * k, cy + 62 * k - 9 * k, x + 9 * k, cy + 62 * k + 9 * k], fill=(TERRA if dx < 0 else MARI) + (220,))


def m_report(d, W, H, k, cx, cy):
    w2, h2 = 132 * k, 172 * k
    d.rounded_rectangle([cx - w2, cy - h2, cx + w2, cy + h2], radius=14 * k, outline=INK + (230,), width=int(5 * k))
    d.line([cx - w2 + 22 * k, cy - h2 + 52 * k, cx + w2 - 22 * k, cy - h2 + 52 * k], fill=TERRA + (255,), width=int(5 * k))
    d.ellipse([cx - 15 * k, cy - h2 + 12 * k, cx + 15 * k, cy - h2 + 42 * k], fill=MARI + (255,))
    for i, frac in enumerate([0.86, 0.68, 0.78, 0.5]):
        y = cy - h2 + 84 * k + i * 44 * k
        bw = (w2 * 2 - 44 * k) * frac
        d.rounded_rectangle([cx - w2 + 22 * k, y, cx - w2 + 22 * k + bw, y + 15 * k], radius=7 * k, fill=(SAND if i % 2 else CLAY) + (230,))
    bx, by, br = cx + w2 - 8 * k, cy + h2 - 6 * k, 34 * k
    d.ellipse([bx - br, by - br, bx + br, by + br], fill=MARI + (255,))
    d.line([bx - 15 * k, by, bx - 4 * k, by + 11 * k], fill=IVORY + (255,), width=int(6 * k))
    d.line([bx - 4 * k, by + 11 * k, bx + 16 * k, by - 13 * k], fill=IVORY + (255,), width=int(6 * k))


def m_checklist(d, W, H, k, cx, cy):
    d.line([cx - 118 * k, cy - 130 * k, cx - 118 * k, cy + 130 * k], fill=LINEC + (220,), width=int(3 * k))
    for i in range(3):
        y = cy + (i - 1) * 96 * k
        d.ellipse([cx - 148 * k, y - 28 * k, cx - 92 * k, y + 28 * k], outline=TERRA + (255,), width=int(5 * k))
        if i < 2:
            d.line([cx - 134 * k, y + 1 * k, cx - 122 * k, y + 12 * k], fill=MARI + (255,), width=int(6 * k))
            d.line([cx - 122 * k, y + 12 * k, cx - 104 * k, y - 13 * k], fill=MARI + (255,), width=int(6 * k))
        bw = [150, 118, 168][i] * k
        d.rounded_rectangle([cx - 62 * k, y - 11 * k, cx - 62 * k + bw, y + 11 * k], radius=10 * k, fill=(SAND if i % 2 else CLAY) + (235,))
    ring_dots(d, cx, cy, 218 * k, 14, 3 * k, MARI, 90)


def m_bowl(d, W, H, k, cx, cy):
    d.pieslice([cx - 135 * k, cy - 40 * k, cx + 135 * k, cy + 130 * k], 0, 180, fill=TERRA + (255,))
    d.ellipse([cx - 135 * k, cy - 56 * k, cx + 135 * k, cy - 24 * k], outline=TERRA_D + (255,), width=int(5 * k))
    for dx, r in [(-70, 17), (0, 21), (70, 17)]:
        d.ellipse([cx + dx * k - r * k, cy - 62 * k - r * k, cx + dx * k + r * k, cy - 62 * k + r * k], fill=MARI + (235,))
    for dx in (-42, 30):
        d.arc([cx + dx * k - 15 * k, cy - 148 * k, cx + dx * k + 15 * k, cy - 92 * k], 300, 130, fill=CLAY + (200,), width=int(5 * k))
    d.line([cx - 80 * k, cy + 148 * k, cx + 80 * k, cy + 148 * k], fill=MARI + (255,), width=int(6 * k))
    ring_dots(d, cx, cy, 200 * k, 18, 3.2 * k, TERRA, 100)


MOTIFS = {
    "sun": m_sun, "moon": m_moon, "leaf": m_leaf, "drop": m_drop,
    "flame": m_flame, "rings": m_rings, "balloon": m_balloon, "cup": m_cup,
    "stalk": m_stalk, "strands": m_strands, "flakes": m_flakes,
    "plate": m_plate, "pair": m_pair, "glass": m_glass, "gauge": m_gauge,
    "report": m_report, "checklist": m_checklist, "bowl": m_bowl,
}


def render(motif, glyph, w, h, variant, path):
    img, d = base(w, h, seed=abs(hash(motif)) % 97)
    W, H = w * S, h * S
    cx, cy = W // 2, int(H * 0.42)
    fn = MOTIFS[motif]
    if variant == 1:
        fn(d, W, H, S * (w / 720) * 1.06, cx, cy)
    elif variant == 2:
        fn(d, W, H, S * (w / 720) * 0.60, cx, int(H * 0.26))
        try:
            f = ImageFont.truetype(SERIF, int(320 * S * (w / 720)))
            d.text((cx, int(H * 0.68)), glyph, font=f, fill=TERRA + (42,), anchor="mm")
        except Exception:
            pass
    else:
        rnd = random.Random(11)
        for gx in range(3):
            for gy in range(3):
                if gx == 1 and gy == 1:
                    continue
                px = int(W * (0.22 + gx * 0.28)) + rnd.randint(-8, 8) * S
                py = int(H * (0.15 + gy * 0.25))
                fn(d, W, H, S * 0.28, px, py)
        fn(d, W, H, S * (w / 720) * 0.76, cx, cy)
    img = img.resize((w, h), Image.LANCZOS)
    img.save(path, quality=86)


def publisher_logo(path):
    w = h = 512
    img = Image.new("RGB", (w * S, h * S), IVORY)
    d = ImageDraw.Draw(img, "RGBA")
    W = w * S
    d.ellipse([30 * S, 30 * S, W - 30 * S, W - 30 * S], outline=LINEC + (255,), width=4 * S)
    cx, cy = W // 2, W // 2
    d.polygon(leaf_pts(cx, cy, 300 * S, 168 * S), fill=TERRA + (255,))
    d.line([cx, cy + 118 * S, cx, cy - 108 * S], fill=MARI + (255,), width=13 * S)
    img = img.resize((w, h), Image.LANCZOS)
    img.save(path)


def main():
    manifest = json.load(open(sys.argv[1], encoding="utf-8"))
    out = sys.argv[2]
    for st in manifest:
        outdir = os.path.join(out, "stories", st["slug"])
        os.makedirs(outdir, exist_ok=True)
        render(st["motif"], st["glyph"], 720, 960, 1, os.path.join(outdir, "poster.jpg"))
        render(st["motif"], st["glyph"], 720, 1280, 1, os.path.join(outdir, "art1.jpg"))
        render(st["motif"], st["glyph"], 720, 1280, 2, os.path.join(outdir, "art2.jpg"))
        render(st["motif"], st["glyph"], 720, 1280, 3, os.path.join(outdir, "art3.jpg"))
        render(st["motif"], st["glyph"], 1200, 675, 1, os.path.join(outdir, "og.jpg"))
        print("art:", st["slug"])
    publisher_logo(os.path.join(out, "publisher-logo.png"))
    print("logo done")


if __name__ == "__main__":
    main()
