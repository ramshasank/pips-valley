#!/usr/bin/env python3
"""Assemble Pip's Playhouse.

Outputs:
  web/index.html          full document that links css/js (GitHub Pages, local dev)
  web/dist/playhouse.html single self-contained page body (inlined css/js) for hosting as one file
"""
import base64, glob, os, re, subprocess, datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
CSS = ["css/core.css", "css/shell.css"] + sorted(p[len(ROOT) + 1:] for p in glob.glob(ROOT + "/css/activities/*.css"))
JS = ["js/core.js", "js/glyphs.js", "engine/stage.js", "art/kit.js", "art/characters.js"] + sorted(p[len(ROOT) + 1:] for p in glob.glob(ROOT + "/art/*.js") if os.path.basename(p) not in ("kit.js", "characters.js")) + ["engine/game.js", "home/valley.js"] + sorted(p[len(ROOT) + 1:] for p in glob.glob(ROOT + "/games/*.js")) + sorted(p[len(ROOT) + 1:] for p in glob.glob(ROOT + "/js/activities/*.js")) + ["js/main.js"]

TITLE = "Pip's Valley"
FONTS = ''  # fonts are embedded (web/fonts, css/shell.css)


def build_stamp():
    """Shown on the start screen so a parent can tell which build is on their device."""
    try:
        n = subprocess.check_output(["git", "rev-list", "--count", "HEAD"], cwd=ROOT, text=True).strip()
    except Exception:
        n = "0"
    return f"{n} · {datetime.datetime.now(datetime.timezone.utc).strftime('%b %d, %H:%M')} UTC"


BODY = '<div id="app"><div id="stage"></div><div id="overlay"></div><canvas id="fx"></canvas></div>'


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


def build_index():
    css = "\n".join(f'<link rel="stylesheet" href="{c}">' for c in CSS)
    js = f'<script>window.BUILD = "{build_stamp()}";</script>\n' + "\n".join(f'<script src="{j}"></script>' for j in JS)
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="#8fd3ff">
<link rel="manifest" href="manifest.webmanifest">
<title>{TITLE}</title>
{FONTS}
{css}
</head>
<body>
{BODY}
{js}
</body>
</html>
"""
    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)


def inline_fonts(css):
    """Embed the font files so the single-file build works offline."""
    def sub(m):
        with open(os.path.join(ROOT, "fonts", m.group(1)), "rb") as f:
            return 'url("data:font/woff2;base64,' + base64.b64encode(f.read()).decode() + '")'
    return re.sub(r'url\("\.\./fonts/([\w.-]+)"\)', sub, css)


def check_no_emoji():
    """New screens are drawn art only. Fail the build if an emoji sneaks into them."""
    emoji = re.compile("[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B50\u2B06\u2934\u2935\u25B6\u23F0-\u23FA]")
    for rel in [j for j in JS if j.split("/")[0] in ("engine", "art", "home", "games")]:
        for n, line in enumerate(read(rel).splitlines(), 1):
            if emoji.search(line) and "FROM_EMOJI" not in line:
                raise SystemExit(f"emoji in {rel}:{n} — draw it with the art kit instead")


def build_single():
    css = inline_fonts("\n".join(read(c) for c in CSS))
    js = f'window.BUILD = "{build_stamp()}";\n' + "\n;\n".join(read(j) for j in JS).replace("</script", "<\\/script")
    html = f"""<title>{TITLE}</title>
<meta name="claude:viewport-fit-sides" content="cover">
{FONTS}
<style>
{css}
</style>
{BODY}
<script>
{js}
</script>
"""
    os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
    with open(os.path.join(ROOT, "dist", "playhouse.html"), "w", encoding="utf-8") as f:
        f.write(html)
    return len(html)


if __name__ == "__main__":
    check_no_emoji()
    build_index()
    n = build_single()
    print(f"built index.html ({len(JS)} scripts) and dist/playhouse.html ({n // 1024} KB)")
