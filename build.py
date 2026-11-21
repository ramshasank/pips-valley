#!/usr/bin/env python3
"""Assemble Pip's Playhouse.

Outputs:
  index.html             lazy-loading entry point (GitHub Pages, local dev)
  dist/playhouse.html    combined code, with media copied alongside it
"""
import argparse, ast, base64, glob, hashlib, json, os, re, shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
CSS = ["css/core.css", "css/shell.css"] + sorted(p[len(ROOT) + 1:] for p in glob.glob(ROOT + "/css/activities/*.css"))
JS = ["js/core.js", "js/artwork.js", "js/loader.js", "js/glyphs.js", "engine/stage.js", "art/kit.js", "art/characters.js"] + sorted(p[len(ROOT) + 1:] for p in glob.glob(ROOT + "/art/*.js") if os.path.basename(p) not in ("kit.js", "characters.js")) + ["engine/game.js", "home/valley.js"] + sorted(p[len(ROOT) + 1:] for p in glob.glob(ROOT + "/games/*.js")) + sorted(p[len(ROOT) + 1:] for p in glob.glob(ROOT + "/js/activities/*.js")) + ["js/main.js"]

TITLE = "Pip's Valley"
FONTS = ''  # fonts are embedded (web/fonts, css/shell.css)


def build_stamp():
    """Shown on the start screen so a parent can tell which build is on their device."""
    # Content-based: reproducible across machines, commits, and CI checkouts.
    files = JS + CSS + ["build.py", "manifest.webmanifest", "voice/index.json"]
    digest = hashlib.sha256()
    for path in files:
        digest.update(path.encode())
        with open(os.path.join(ROOT, path), "rb") as source:
            digest.update(source.read())
    return digest.hexdigest()[:10]



BODY = '<div id="app"><div id="stage"></div><div id="overlay"></div><canvas id="fx"></canvas></div>'


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


def ver(rel):
    """A short fingerprint of a file, added to its link so browsers fetch the new copy after an update instead of a stale cached one."""
    import hashlib
    try:
        with open(os.path.join(ROOT, rel), "rb") as f:
            return hashlib.sha1(f.read()).hexdigest()[:8]
    except OSError:
        return "0"


def activity_catalog():
    """Read simple registration metadata; fail loudly if a new format needs support."""
    catalog = []
    for path in JS:
        if not path.startswith("games/"):
            continue
        source = read(path)
        registration = re.search(r"K\.game\(\{(.*?)\b(?:icon|start|lines)\b", source, re.S)
        if not registration:
            if path.endswith("story-tales.js"):
                continue
            raise ValueError(f"Missing activity metadata: {path}")
        fields = {}
        for key in ("id", "title", "voice", "group", "age", "subject", "order"):
            match = re.search(r"\b" + key + r"\s*:\s*('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\"|[0-9]+|ID)\s*[,}]?", registration[1])
            if match:
                value = match[1]
                if value == "ID":
                    value = re.search(r"\bID\s*=\s*('[^']+'|\"[^\"]+\")", source)[1]
                fields[key] = ast.literal_eval(value)
        if not all(k in fields for k in ("id", "title", "group")):
            raise ValueError(f"Incomplete activity metadata: {path}")
        dependencies = ["games/story-tales.js", path] if fields["id"] == "story" else [path]
        fields["scripts"] = [p + "?v=" + ver(p) for p in dependencies]
        catalog.append(fields)
    if len({d["id"] for d in catalog}) != len(catalog):
        raise ValueError("Duplicate activity IDs")
    return catalog


def document(css, js):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#8fd3ff">
<meta name="description" content="A free, playful learning valley for children. Games, stories, art and music, with no ads or accounts.">
<link rel="manifest" href="manifest.webmanifest">
<title>{TITLE}</title>
{css}
</head>
<body>
{BODY}
<noscript>Pip's Valley needs JavaScript to play. Please enable JavaScript in your browser.</noscript>
{js}
</body>
</html>
"""


def index_html():
    css = "\n".join(f'<link rel="stylesheet" href="{c}?v={ver(c)}">' for c in CSS)
    settings = json.dumps(activity_catalog(), separators=(",", ":")).replace("<", "\\u003c")
    js = f'<script>window.BUILD = "{build_stamp()}"; window.VOICE_V = "{ver("voice/index.json")}"; window.PIP_CATALOG = {settings};</script>\n'
    js += "\n".join(f'<script defer src="{j}?v={ver(j)}"></script>' for j in JS if not j.startswith("games/"))
    return document(css, js)


def build_index():
    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as f:
        f.write(index_html())


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
    js = f'window.BUILD = "{build_stamp()}"; window.VOICE_V = "{ver("voice/index.json")}";\n' + "\n;\n".join(read(j) for j in JS).replace("</script", "<\\/script")
    html = document(f"<style>\n{css}\n</style>", f"<script>\n{js}\n</script>")
    # A portable folder, rather than an HTML file with missing images and recordings.
    for folder in ("img", "voice", "films"):
        shutil.copytree(os.path.join(ROOT, folder), os.path.join(ROOT, "dist", folder), dirs_exist_ok=True, ignore=shutil.ignore_patterns(".*", "previews", "lines.json"))
    for file in ("manifest.webmanifest", "LICENSE", "LICENSE-ART.md", "fonts/OFL.txt"):
        target = os.path.join(ROOT, "dist", file)
        os.makedirs(os.path.dirname(target), exist_ok=True)
        shutil.copyfile(os.path.join(ROOT, file), target)

    os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
    with open(os.path.join(ROOT, "dist", "playhouse.html"), "w", encoding="utf-8") as f:
        f.write(html)
    return len(html)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="check generated entry point without writing files")
    parser.add_argument("--web-only", action="store_true", help="skip the portable distribution")
    args = parser.parse_args()
    check_no_emoji()
    if args.check:
        if read("index.html") != index_html():
            raise SystemExit("index.html is stale; run python3 build.py --web-only")
        print("Generated entry point is current")
    else:
        build_index()
        if not args.web_only:
            n = build_single()
            print(f"Built portable dist/playhouse.html ({n // 1024} KB) with local media")
        print(f"Built index.html ({len(activity_catalog())} activities loaded on demand)")
