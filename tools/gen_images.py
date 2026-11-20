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

OBJ = "One single thing, whole and uncropped, centred, with space around it. Transparent background, nothing else in the picture, no ground, no shadow on the floor. "
LIKE = "Draw, in exactly the illustration style and materials of the first reference picture (layered cut paper with felt-like gouache texture): "
STYLEREF = "In exactly the same illustration style as the reference picture: "
SAME = "The same character as in the reference picture, exactly the same colours, shapes and style. "
SAMEIT = "The same little engine as in the reference picture, exactly the same colours, shapes, size, position and style. "

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
    "star": {
        "star": dict(size="1024x1024", alpha=True, ref=["bobo/bobo", "refs/star"], prompt=OBJ + LIKE + "Little Star, the character in the second reference picture: a plump, rounded five-pointed golden yellow star with big shiny dark eyes with a white sparkle, rosy cheeks and a small happy smile. She has no arms and no legs. Keep her shape and face as in the second picture. No bear."),
        "star-happy": dict(size="1024x1024", alpha=True, ref=["star"], prompt=OBJ + SAME + "Now her mouth is wide open in a joyful laugh."),
        "star-sad": dict(size="1024x1024", alpha=True, ref=["star"], prompt=OBJ + SAME + "Now she is sad: a small downturned mouth, worried eyebrows and one pale blue tear on her cheek."),
        "star-wink": dict(size="1024x1024", alpha=True, ref=["star"], prompt=OBJ + SAME + "Now she is winking: her left eye is closed in a little curved line, the other eye open, with a cheeky smile."),
        "ministar": dict(size="1024x1024", alpha=True, ref=["star"], prompt=OBJ + "A baby star in exactly the same style as the reference picture, but simpler and paler: a small rounded five-pointed pale yellow star with two tiny dot eyes and a tiny smile, no cheeks."),
        "pip": dict(size="1024x1024", alpha=True, ref=["bobo/bobo", "refs/pip"], prompt=CUT + LIKE + "Pip, the character in the second reference picture: a small round orange creature shaped like a plump apricot, with a cream tummy patch, two green leaves sprouting from the top of his head, big shiny dark eyes with a white sparkle, rosy cheeks, a small smile, tiny stubby arms and two tiny feet. Keep his shape, colours and leaves as in the second picture. No bear ears."),
        "pip-happy": dict(size="1024x1024", alpha=True, ref=["pip"], prompt=CUT + SAME + "Now he is cheering with his mouth open in a big laugh and both tiny arms up."),
        "pip-oh": dict(size="1024x1024", alpha=True, ref=["pip"], prompt=CUT + SAME + "Now his mouth is a small round surprised O and his eyes are wide, as if he is trying very hard."),
        "owl": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=CUT + STYLEREF + "a small round owl with warm brown feathers, a cream heart-shaped face and tummy, very big round shiny eyes, a tiny orange beak, little ear tufts, rosy cheeks and small folded wings, standing upright, facing the viewer."),
        "cat": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=CUT + STYLEREF + "a small soft grey kitten with a cream muzzle and tummy, pointed ears with pink insides, a long curled tail, whiskers, big shiny eyes and rosy cheeks, standing upright, facing the viewer."),
        "panda": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=CUT + STYLEREF + "a small chubby panda cub, white with black ears, black eye patches, black arms and legs, big shiny eyes and rosy cheeks, standing upright, facing the viewer."),
        "house": dict(size="1024x1024", alpha=True, ref=["bobo/bobo", "refs/house"], prompt=OBJ + LIKE + "the little cottage in the second reference picture, with no characters: cream walls, a red roof with a chimney, a round attic window, a teal front door and two square windows glowing warm yellow as if the lights are on inside. Front view."),
        "rocket": dict(size="1024x1024", alpha=True, ref=["bobo/bobo", "refs/rocket"], prompt=OBJ + LIKE + "the little toy rocket in the second reference picture, with no characters: standing upright, a red body with a cream nose cone, a yellow stripe, one round porthole window with pale blue glass in the middle, and two purple fins at the bottom. No flames, no smoke."),
        "rocket-riders": dict(size="1024x1024", alpha=True, ref=["rocket", "star"], prompt=OBJ + "Exactly the same rocket as the first reference picture, same shape, colours and style. Now the round window glows warm yellow and the little star from the second reference picture is peeking out of it, only her smiling face showing inside the window. No flames, no smoke."),
        "cloud": dict(size="1024x1024", alpha=True, ref=["bobo/cloud"], prompt=OBJ + "Exactly the same cloud as the reference picture, same shape, same sleepy smiling face and same style, but soft white paper with pale blue-grey shading, not grey."),
        "bg-night": dict(size="1536x1024", ref=["bobo/bg-day"], prompt="The very same meadow as the reference picture, same hills, same composition and same horizon across the middle, but at night: a deep indigo blue sky scattered with small cream paper stars, dark blue-green hills and a moonlit dark teal-green meadow with a few pale flowers. No moon, no characters, no animals, no houses. Leave the middle of the meadow empty."),
        "bg-space": dict(size="1536x1024", ref=["bobo/bg-day"], prompt="In the same cut paper and gouache style as the reference picture, but a completely different scene: outer space filling the whole picture, deep indigo and violet sky with many small cream paper stars of different sizes, soft swirls of darker and lighter blue, and one small friendly ringed planet in peach and pink in the top right corner. No ground, no grass, no hills, no characters, no rocket. Leave the middle empty."),
    },
    "toot": {
        "toot": dict(size="1536x1024", alpha=True, ref=["bobo/bobo", "refs/toot"], prompt=OBJ + LIKE + "Toot, the little red steam engine in the second reference picture, seen exactly from the side and facing right: a red rounded boiler with a friendly face on it (two big shiny eyes, rosy cheeks, a small smile), a red cab at the back with a pale blue window and a dark roof, a dark funnel with a purple rim, a yellow dome, a yellow stripe and a small yellow cowcatcher at the front. IMPORTANT: draw him with NO WHEELS at all. The engine ends at a flat dark bar along its bottom edge, with nothing underneath. No track, no smoke, no bear."),
        "toot-happy": dict(size="1536x1024", alpha=True, ref=["toot"], prompt=OBJ + SAMEIT + "Now his mouth is wide open in a happy laugh. Still no wheels, nothing under the flat dark bar."),
        "toot-oh": dict(size="1536x1024", alpha=True, ref=["toot"], prompt=OBJ + SAMEIT + "Now his mouth is a small round surprised O and his eyes are wide. Still no wheels, nothing under the flat dark bar."),
        "toot-sleep": dict(size="1536x1024", alpha=True, ref=["toot"], prompt=OBJ + SAMEIT + "Now he is fast asleep: both eyes closed in little curved lines, with a small peaceful smile. Still no wheels, nothing under the flat dark bar."),
        "wheel": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one toy train wheel seen exactly flat from the side so that it is a perfect circle: a thick dark charcoal rim, a golden yellow middle with six dark spokes and a dark round hub. Perfectly round and symmetrical. No characters."),
        "wagon": dict(size="1024x1024", alpha=True, ref=["bobo/bobo", "refs/wagon"], prompt=OBJ + LIKE + "the open wooden goods wagon in the second reference picture, seen exactly from the side, with no characters: a simple brown wooden box with plank lines and a darker rim along the top, empty. IMPORTANT: NO WHEELS at all, the wagon ends at its flat bottom edge with nothing underneath."),
        "apples": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one shiny round red apple with a short brown stalk and one green leaf. No face, no characters."),
        "cakes": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one cupcake in a blue paper case with a swirl of pink icing and a red cherry on top. No face, no characters."),
        "flowers": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one small bunch of three flowers, pink, yellow and white, with green stems and leaves tied with a ribbon. No face, no characters."),
        "shed": dict(size="1536x1024", alpha=True, ref=["bobo/bobo", "refs/shed"], prompt=OBJ + LIKE + "the engine shed in the second reference picture, front view, with no characters: a wide teal wooden shed with plank lines, a low red pitched roof with a yellow round sign, and one very big dark arched doorway in the middle that reaches the ground. The doorway is dark and empty inside."),
        "town": dict(size="1536x1024", alpha=True, ref=["bobo/bobo", "refs/town"], prompt=OBJ + LIKE + "the little town in the second reference picture, front view, with no characters: three small cottages in a row with red and blue roofs, the middle one with a clock, a string of colourful bunting flags between them and two round green trees at the sides. All standing on one flat line."),
        "bg-eve": dict(size="1536x1024", ref=["bobo/bg-day"], prompt="The very same meadow as the reference picture, same hills, same composition and same horizon across the middle, but at dusk: a warm sunset sky fading from peach and pink near the hills to soft purple at the top, with a few small early stars, and the meadow in gentle dim evening greens. No sun, no moon, no characters, no animals. Leave the middle of the meadow empty."),
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
            # "name": same book; "book/name": another book; "refs/name": a drawing rendered from the app (tools/refs)
            src = os.path.join(ROOT, "tools", r + ".png") if r.startswith("refs/") else os.path.join(ROOT, "img", r + ".webp") if "/" in r else os.path.join(out_dir, r + ".webp")
            f = tempfile.NamedTemporaryFile(suffix=".png", delete=False); Image.open(src).save(f.name); tmp.append(f.name)
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
