#!/usr/bin/env python3
"""Generate picture-book art for Story Studio with the OpenAI image API.

  OPENAI_API_KEY=... python3 tools/gen_images.py bobo [name ...] [--quality medium] [--force]

Reads the key from the OPENAI_API_KEY environment variable only. Writes WebP files to web/img/<book>/
and prints what each picture cost in tokens. Pictures that already exist are skipped unless --force.
"""
import base64, io, json, os, subprocess, sys, tempfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.environ.get("IMAGE_MODEL", "gpt-image-2.6-sunburst")
KEY = os.environ.get("OPENAI_API_KEY", "")
# dollars per million tokens (text in, image in, image out)
RATE = (5.0, 8.0, 30.0)

STYLE = ("Children's picture book illustration made of layered cut paper collage with soft gouache texture, "
         "gentle paper shadows, rounded friendly shapes, warm and cosy, simple and uncluttered, for a three year old. "
         "No text, no letters, no border.")
CUT = ("One single character, whole body from head to toe, standing upright, centred, with space around it. "
       "Transparent background, nothing else in the picture, no ground, no shadow on the floor. ")
BOBO = ("Bobo, a small chubby bear cub with warm honey-brown paper fur, a cream muzzle and tummy, round ears with pink insides, "
        "big shiny dark eyes with a white sparkle, rosy cheeks, a little dark nose and short stubby arms and legs")

BOOKS = {
    "bobo": {
        "bobo": dict(size="1024x1024", alpha=True, prompt=CUT + BOBO + ", smiling gently, arms by his sides, facing the viewer and turned slightly to the right."),
        "bobo-happy": dict(size="1024x1024", alpha=True, ref=["bobo"], prompt=CUT + "The same bear cub as in the reference picture, exactly the same colours, shapes and style. Now he is laughing with his mouth open and both arms up in the air with joy."),
        "bobo-sleep": dict(size="1024x1024", alpha=True, ref=["bobo"], prompt=CUT + "The same bear cub as in the reference picture, exactly the same colours, shapes and style. Now he is fast asleep sitting up, eyes closed in two little curved lines, head tilted, peaceful smile."),
        "bobo-mud": dict(size="1024x1024", alpha=True, ref=["bobo"], prompt=CUT + "The same bear cub as in the reference picture, exactly the same colours, shapes, pose and style. Now he has a few big smooth splats of wet dark brown mud on him: one on his tummy, one on a cheek, one on an ear and mud on both feet. Most of his fur is still clean and honey-brown. Not spotted, not patterned. He is grinning happily."),
        "mama": dict(size="1024x1024", alpha=True, ref=["bobo"], prompt=CUT + "Mama Bear, the grown-up mother of the bear cub in the reference picture: the same honey-brown paper fur, cream muzzle and style, but bigger, taller and rounder, with kind sleepy eyes, wearing a tomato-red scarf. Smiling warmly, facing the viewer and turned slightly to the left."),
        "frog": dict(size="1024x1024", alpha=True, ref=["bobo"], prompt=CUT + "In exactly the same illustration style as the reference picture: a small round green frog with a pale yellow tummy, big bulging friendly eyes on top of its head, a wide smile and rosy cheeks, sitting upright, facing the viewer and turned slightly to the left."),
        "bunny": dict(size="1024x1024", alpha=True, ref=["bobo"], prompt=CUT + "In exactly the same illustration style as the reference picture: a small soft grey-white bunny with long upright ears with pink insides, a tiny pink nose, big shiny eyes and rosy cheeks, standing upright, facing the viewer and turned slightly to the left."),
        "fox": dict(size="1024x1024", alpha=True, ref=["bobo"], prompt=CUT + "In exactly the same illustration style as the reference picture: a small orange fox cub with a cream muzzle and tummy, pointed ears, a bushy tail with a white tip, big shiny eyes and rosy cheeks, standing upright, facing the viewer and turned slightly to the left."),
        "bg-rain": dict(size="1536x1024", prompt="A wide empty rainy meadow scene with no characters and no animals. Soft grey-blue rainy sky filling the top half with gentle pale clouds, rolling muted green hills in the distance, and a broad flat open grassy meadow filling the whole bottom half, with a few small tufts of grass and tiny wet flowers at the edges. The horizon line is exactly across the middle. Leave the middle of the meadow empty. No falling rain drops, no puddles, no sun."),
        "bg-day": dict(size="1536x1024", ref=["bg-rain"], prompt="The very same meadow as the reference picture, same hills, same composition and same horizon across the middle, but now the rain has stopped: a bright fresh blue sky with a few small white clouds, fresh sunny greens, small bright flowers. No characters, no animals, no rainbow, no sun disc, no puddles. Leave the middle of the meadow empty."),
        "den": dict(size="1024x1024", alpha=True, ref=["bobo"], prompt="In exactly the same illustration style as the reference picture, but with no characters: a cosy bear den, a rounded grassy mound of earth with a big dark arched doorway in the middle, a few stones and leaves around the doorway and a little tuft of grass on top. One single object, centred. Transparent background, nothing else in the picture."),
        "cloud": dict(size="1024x1024", alpha=True, ref=["bobo"], prompt="In exactly the same illustration style as the reference picture, but with no characters: one plump grey rain cloud, wide and puffy, with a sleepy smiling face (two closed curved eyes, rosy cheeks, little smile). One single object, centred. Transparent background, nothing else in the picture, no rain drops."),
        "rainbow": dict(size="1536x1024", alpha=True, ref=["bobo"], prompt="In exactly the same illustration style as the reference picture, but with no characters: one big rainbow arch made of layered cut paper bands in red, orange, yellow, green, blue and purple, a full half circle whose two ends touch the bottom edge of the picture. Transparent background, nothing else in the picture, no clouds."),
        "puddle": dict(size="1536x1024", alpha=True, ref=["bobo"], prompt="In exactly the same illustration style as the reference picture, but with no characters: one big shiny rain puddle on the ground, seen from the side at a low angle so it is a wide flat oval, pale blue water with soft white reflections and a darker muddy brown rim. One single object, centred. Transparent background, nothing else in the picture."),
    },
}


def call(spec, out_dir, quality):
    body = dict(model=MODEL, prompt=spec["prompt"] + " " + STYLE, size=spec["size"], quality=quality, n="1")
    if spec.get("alpha"):
        body.update(background="transparent", output_format="png")
    cmd = ["curl", "-sS", "-m", "300", "-H", "Authorization: Bearer " + KEY]
    if spec.get("ref"):
        url = "https://api.openai.com/v1/images/edits"
        tmp = []
        for r in spec["ref"]:
            f = tempfile.NamedTemporaryFile(suffix=".png", delete=False); Image.open(os.path.join(out_dir, r + ".webp")).save(f.name); tmp.append(f.name)
            cmd += ["-F", "image[]=@" + f.name]
        for k, v in body.items():
            cmd += ["--form-string", f"{k}={v}"]
    else:
        url = "https://api.openai.com/v1/images/generations"
        body["n"] = 1
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(body)]
    res = json.loads(subprocess.run(cmd + [url], capture_output=True, text=True, check=True).stdout)
    if "error" in res:
        raise SystemExit("API error: " + json.dumps(res["error"])[:600])
    u = res.get("usage", {}); d = u.get("input_tokens_details", {})
    cost = (d.get("text_tokens", 0) * RATE[0] + d.get("image_tokens", 0) * RATE[1] + u.get("output_tokens", 0) * RATE[2]) / 1e6
    return Image.open(io.BytesIO(base64.b64decode(res["data"][0]["b64_json"]))), u, cost


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    quality = sys.argv[sys.argv.index("--quality") + 1] if "--quality" in sys.argv else "medium"
    if "--quality" in sys.argv: args.remove(quality)
    if not KEY: raise SystemExit("Set OPENAI_API_KEY first.")
    book = args[0]; names = args[1:] or list(BOOKS[book])
    out_dir = os.path.join(ROOT, "img", book); os.makedirs(out_dir, exist_ok=True)
    total = 0
    for name in names:
        path = os.path.join(out_dir, name + ".webp")
        if os.path.exists(path) and "--force" not in sys.argv: print("have", name); continue
        img, usage, cost = call(BOOKS[book][name], out_dir, quality); total += cost
        if BOOKS[book][name].get("alpha"):
            img = img.convert("RGBA"); box = img.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
            if box: img = img.crop(box)
        else: img = img.convert("RGB")
        img.save(path, "WEBP", quality=88, method=6)
        print(f"made {name} {img.size} mode={img.mode} ~${cost:.3f} usage={json.dumps(usage)}", flush=True)
    print(f"total ~${total:.2f}")


if __name__ == "__main__":
    main()
