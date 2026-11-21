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
    "pip": {
        "pip": dict(size="1024x1024", alpha=True, ref=["bobo/bobo", "refs/pip"], prompt=CUT + LIKE + "Pip, the character in the second reference picture: a small round orange creature shaped like a plump apricot, with a cream tummy patch, two green leaves sprouting from the top of his head, big shiny dark eyes with a white sparkle, rosy cheeks, a small smile, tiny stubby arms and two tiny feet. Keep his shape, colours and leaves as in the second picture. No bear ears."),
        "pip-happy": dict(size="1024x1024", alpha=True, ref=["pip"], prompt=CUT + SAME + "Now he is cheering with his mouth open in a big laugh and both tiny arms up."),
        "pip-oh": dict(size="1024x1024", alpha=True, ref=["pip"], prompt=CUT + SAME + "Now his mouth is a small round surprised O and his eyes are wide, as if he is trying very hard."),
        "pip-wave": dict(size="1024x1024", alpha=True, ref=["pip/pip"], prompt=CUT + SAME + "Same pose and same smile, but now his left arm (on the right side of the picture) is raised up high, waving hello. The other arm stays down."),
    },
    "star": {
        "star": dict(size="1024x1024", alpha=True, ref=["bobo/bobo", "refs/star"], prompt=OBJ + LIKE + "Little Star, the character in the second reference picture: a plump, rounded five-pointed golden yellow star with big shiny dark eyes with a white sparkle, rosy cheeks and a small happy smile. She has no arms and no legs. Keep her shape and face as in the second picture. No bear."),
        "star-happy": dict(size="1024x1024", alpha=True, ref=["star"], prompt=OBJ + SAME + "Now her mouth is wide open in a joyful laugh."),
        "star-sad": dict(size="1024x1024", alpha=True, ref=["star"], prompt=OBJ + SAME + "Now she is sad: a small downturned mouth, worried eyebrows and one pale blue tear on her cheek."),
        "star-wink": dict(size="1024x1024", alpha=True, ref=["star"], prompt=OBJ + SAME + "Now she is winking: her left eye is closed in a little curved line, the other eye open, with a cheeky smile."),
        "ministar": dict(size="1024x1024", alpha=True, ref=["star"], prompt=OBJ + "A baby star in exactly the same style as the reference picture, but simpler and paler: a small rounded five-pointed pale yellow star with two tiny dot eyes and a tiny smile, no cheeks."),
        "owl": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=CUT + STYLEREF + "a small round owl with warm brown feathers, a cream heart-shaped face and tummy, very big round shiny eyes, a tiny orange beak, little ear tufts, rosy cheeks and small folded wings, standing upright, facing the viewer."),
        "cat": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=CUT + STYLEREF + "a small soft grey kitten with a cream muzzle and tummy, pointed ears with pink insides, a long curled tail, whiskers, big shiny eyes and rosy cheeks, standing upright, facing the viewer."),
        "panda": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=CUT + STYLEREF + "a small chubby panda cub, white with black ears, black eye patches, black arms and legs, big shiny eyes and rosy cheeks, standing upright, facing the viewer."),
        "house": dict(size="1024x1024", alpha=True, ref=["bobo/bobo", "refs/house"], prompt=OBJ + LIKE + "the little cottage in the second reference picture, with no characters: cream walls, a red roof with a chimney, a round attic window, a teal front door and two square windows glowing warm yellow as if the lights are on inside. Front view."),
        "rocket": dict(size="1024x1024", alpha=True, ref=["bobo/bobo", "refs/rocket"], prompt=OBJ + LIKE + "the little toy rocket in the second reference picture, with no characters: standing upright, a red body with a cream nose cone, a yellow stripe, one round porthole window with pale blue glass in the middle, and two purple fins at the bottom. No flames, no smoke."),
        "rocket-riders": dict(size="1024x1024", alpha=True, ref=["rocket", "star"], prompt=OBJ + "Exactly the same rocket as the first reference picture, same shape, colours and style. Now the round window glows warm yellow and the little star from the second reference picture is peeking out of it, only her smiling face showing inside the window. No flames, no smoke."),
        "cloud": dict(size="1024x1024", alpha=True, ref=["bobo/cloud"], prompt=OBJ + "Exactly the same cloud as the reference picture, same shape, same sleepy smiling face and same style, but soft white paper with pale blue-grey shading, not grey."),
        "moon": dict(size="1024x1024", alpha=True, ref=["bobo/cloud"], prompt=OBJ + STYLEREF + "a round full moon made of pale cream-yellow paper with a few soft darker craters, and the same kind of sleepy smiling face as the reference (two closed curved eyes, rosy cheeks, little smile). A perfect circle. No cloud, no stars, no glow around it."),
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
        "sun": dict(size="1024x1024", alpha=True, ref=["bobo/cloud"], prompt=OBJ + STYLEREF + "a cheerful round golden yellow sun with short rounded orange paper rays all the way round, and a happy awake face: two big shiny dark eyes with a white sparkle, rosy cheeks and a smile. No cloud."),
        "bg-eve": dict(size="1536x1024", ref=["bobo/bg-day"], prompt="The very same meadow as the reference picture, same hills, same composition and same horizon across the middle, but at dusk: a warm sunset sky fading from peach and pink near the hills to soft purple at the top, with a few small early stars, and the meadow in gentle dim evening greens. No sun, no moon, no characters, no animals. Leave the middle of the meadow empty."),
    },
    # Bedtime video "Good Night, Bobo": extra poses that go with the bobo and star pictures.
    "night": {
        "bobo-wave": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=CUT + "The same bear cub as in the reference picture, exactly the same colours, shapes and style. Same gentle smile, but now one arm is raised up high, waving hello. The other arm stays down."),
        "bobo-yawn": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=CUT + "The same bear cub as in the reference picture, exactly the same colours, shapes and style. Now he is giving a big sleepy yawn: mouth wide open in a tall oval, both eyes squeezed shut in little curved lines, one paw raised near his mouth."),
        "owl-sleep": dict(size="1024x1024", alpha=True, ref=["star/owl"], prompt=CUT + "The same owl as in the reference picture, exactly the same colours, shapes, pose and style. Now she is fast asleep: both big eyes closed in two curved lines, peaceful."),
        "frog-sleep": dict(size="1024x1024", alpha=True, ref=["bobo/frog"], prompt=OBJ + "The same frog as in the reference picture, exactly the same colours and style. Now it is fast asleep, crouched low and round on its tummy, both eyes closed in curved lines, a small peaceful smile, rosy cheeks."),
        "bunny-sleep": dict(size="1024x1024", alpha=True, ref=["bobo/bunny"], prompt=OBJ + "The same bunny as in the reference picture, exactly the same colours and style. Now it is fast asleep, curled up small and round on the ground like a ball, long ears laid back flat, eyes closed in curved lines, a small peaceful smile."),
        "tree": dict(size="1024x1536", alpha=True, ref=["bobo/den"], prompt=OBJ + STYLEREF + "one tall friendly old tree with no characters: a thick warm brown trunk, one strong bare branch sticking out sideways to the right about halfway up, and a big rounded crown of dark blue-green leaves in a few layered paper shapes. No face, no animals."),
        "mama-cuddle": dict(size="1024x1024", alpha=True, ref=["bobo/mama", "bobo/bobo-sleep"], prompt=OBJ + "Mama Bear from the first reference picture, sitting down and cuddling the little bear cub from the second reference picture in her arms. The cub is fast asleep against her tummy with his eyes closed. Mama looks down at him with soft sleepy eyes and a gentle smile. Exactly the same colours, red scarf and style as the references."),
    },
    # Story films (bedtime/): feelings for the animal friends, a few new friends and props.
    "tales": {
        "bobo-sad": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=CUT + "The same bear cub as in the reference picture, exactly the same colours, shapes and style. Now he is sad and sorry: head tilted down a little, worried eyebrows, a small downturned mouth, arms hanging by his sides."),
        "fox-happy": dict(size="1024x1024", alpha=True, ref=["bobo/fox"], prompt=CUT + SAME + "Now the fox cub is laughing with his mouth open and both arms up in the air with joy."),
        "fox-sad": dict(size="1024x1024", alpha=True, ref=["bobo/fox"], prompt=CUT + SAME + "Now the fox cub is sad and sorry: ears drooping, worried eyebrows, a small downturned mouth, arms hanging by his sides."),
        "bunny-happy": dict(size="1024x1024", alpha=True, ref=["bobo/bunny"], prompt=CUT + SAME + "Now the bunny is laughing with her mouth open and both arms up in the air with joy."),
        "bunny-sad": dict(size="1024x1024", alpha=True, ref=["bobo/bunny"], prompt=CUT + SAME + "Now the bunny is sad: ears drooping down, worried eyebrows, a small downturned mouth and one pale blue tear on her cheek."),
        "frog-happy": dict(size="1024x1024", alpha=True, ref=["bobo/frog"], prompt=CUT + SAME + "Now the frog is laughing with a very wide open mouth and both arms up in the air with joy."),
        "frog-oh": dict(size="1024x1024", alpha=True, ref=["bobo/frog"], prompt=CUT + SAME + "Now the frog is very surprised: eyes extra wide, mouth a small round O, both hands on his cheeks."),
        "cat-happy": dict(size="1024x1024", alpha=True, ref=["star/cat"], prompt=CUT + SAME + "Now the kitten is laughing with her mouth open and both arms up in the air with joy."),
        "cat-sad": dict(size="1024x1024", alpha=True, ref=["star/cat"], prompt=CUT + SAME + "Now the kitten is sad: ears drooping, worried eyebrows, a small downturned mouth and one pale blue tear on her cheek."),
        "panda-happy": dict(size="1024x1024", alpha=True, ref=["star/panda"], prompt=CUT + SAME + "Now the panda cub is laughing with his mouth open and both arms up in the air with joy."),
        "panda-yuck": dict(size="1024x1024", alpha=True, ref=["star/panda"], prompt=CUT + SAME + "Now the panda cub does not want his food: eyes squeezed shut, tongue sticking out a little, arms crossed over his tummy, head turned slightly away."),
        "owl-fly": dict(size="1024x1024", alpha=True, ref=["star/owl"], prompt=OBJ + SAME + "Now the owl is flying: both wings spread out wide to the sides, feet tucked up, a big happy open smile."),
        "turtle": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "a small friendly turtle seen from the side, walking on four stubby legs and facing right: a rounded green shell with darker green patches, a pale yellow tummy, a round head with big shiny eyes, rosy cheeks and a calm smile."),
        "turtle-happy": dict(size="1024x1024", alpha=True, ref=["turtle"], prompt=OBJ + SAME + "Same side view facing right. Now the turtle is laughing with her mouth wide open and her head lifted up high with joy."),
        "mouse": dict(size="1024x1024", alpha=True, ref=["bobo/bobo"], prompt=CUT + STYLEREF + "a tiny soft grey mouse with very big round ears with pink insides, a cream tummy, a pink nose, long thin tail, big shiny eyes and rosy cheeks, standing upright, facing the viewer."),
        "mouse-happy": dict(size="1024x1024", alpha=True, ref=["mouse"], prompt=CUT + SAME + "Now the mouse is laughing with his mouth open and both arms up in the air with joy."),
        "toot-rolling": dict(size="1536x1024", alpha=True, ref=["toot/toot", "toot/wheel"], prompt=OBJ + "The same little red engine as in the first reference picture, exactly the same colours, shapes, face and style, seen from the side and facing right. Now he has three wheels along the bottom, each one like the wheel in the second reference picture. No track, no smoke."),
        "honey": dict(size="1024x1024", alpha=True, max=512, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one round clay honey pot, warm ochre yellow, with golden honey dripping over the rim and a small wooden honey dipper resting in it. No face, no characters, no letters."),
        "flag": dict(size="1024x1024", alpha=True, max=640, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one finish line flag on a tall wooden pole stuck in a small mound of grass: a black and white chequered flag waving to the right. No face, no characters, no letters."),
        "sprout": dict(size="1024x1024", alpha=True, max=512, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one tiny green seedling with two small round leaves growing out of a small mound of dark brown soil. No face, no characters."),
        "sunflower": dict(size="1024x1536", alpha=True, max=900, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one tall sunflower growing out of a small mound of dark brown soil: a long straight green stem with two big leaves and a big round flower head with bright yellow petals and a brown middle with a small happy smiling face. No other characters."),
        "can": dict(size="1024x1024", alpha=True, max=512, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one small teal blue watering can with a long spout pointing to the right and a round handle. No face, no characters, no water."),
        "kite": dict(size="1024x1024", alpha=True, max=640, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one diamond shaped kite in red and yellow quarters with a short tail of three small paper bows. No face, no characters, no long string."),
        "lilypad": dict(size="1024x1024", alpha=True, max=512, ref=["bobo/puddle"], prompt=OBJ + STYLEREF + "one round green lily pad with a small notch cut out of it and one pink water lily flower on it, seen from the side at a low angle so it is a wide flat oval. No face, no characters, no water."),
        "snowman": dict(size="1024x1024", alpha=True, max=800, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one friendly snowman made of three round snowballs, with a carrot nose, coal eyes, a happy coal smile, rosy cheeks, two stick arms, a tomato-red scarf and a small blue bobble hat."),
        "snowball": dict(size="1024x1024", alpha=True, max=512, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one big round ball of white snow with soft pale blue shading. A perfect circle. No face, no characters."),
        "toybox": dict(size="1024x1024", alpha=True, max=640, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one open wooden toy box painted teal with a yellow star on the front, the lid open at the back, empty inside. No face, no characters, no letters."),
        "gift": dict(size="1024x1024", alpha=True, max=512, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one wrapped present, a purple box with yellow spots and a big tomato-red ribbon bow on top. No face, no characters, no letters."),
        "bush": dict(size="1024x1024", alpha=True, max=800, ref=["night/tree"], prompt=OBJ + STYLEREF + "one big round bushy green bush made of a few layered paper shapes, wide enough for a small animal to hide behind, with a few tiny red berries. No face, no characters."),
        "umbrella": dict(size="1024x1024", alpha=True, max=800, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one big open umbrella held upright, with wide red and yellow panels and a curved wooden handle. No face, no characters."),
        "bg-snow": dict(size="1536x1024", ref=["bobo/bg-day"], prompt="The very same meadow as the reference picture, same hills, same composition and same horizon across the middle, but in deep winter: everything covered in soft white snow with pale blue shadows, snowy white hills, a pale blue-grey winter sky with a few soft clouds. No characters, no animals, no trees, no houses, no falling snow. Leave the middle of the snowy meadow empty."),
    },
}

# ---- Letter Monsters: one friendly monster per letter. The letter itself is NOT in the picture: the app
# prints it on the plain tummy patch in the reading font, so it is always crisp and easy to read.
# Vowels are warm colours, consonants cool ones.
MONSTERS = {
    "a": ("tomato red", "a fluffy tuft of hair on top and two small round ears"), "b": ("sky blue", "two floppy ears that hang down"), "c": ("teal", "one curly antenna with a ball on the end"),
    "d": ("leaf green", "one big floppy tuft of hair that falls to one side"), "e": ("bright orange", "two pointy ears"), "f": ("violet purple", "two antennae with little balls on the ends"),
    "g": ("turquoise", "three short hair sprouts on top"), "h": ("royal blue", "two tiny bat wings at the sides of the head"), "i": ("rose pink", "one small horn in the middle of the head"),
    "j": ("mint green", "long bunny-like ears standing up"), "k": ("lavender", "a row of three soft rounded spikes on top"), "l": ("deep blue", "two small curly horns"),
    "m": ("lime green", "round bear-like ears"), "n": ("plum purple", "a swirl of hair like soft ice cream on top"), "o": ("golden yellow", "two little rounded ears and a tiny tuft"),
    "p": ("aqua blue", "two short stubby antennae"), "q": ("forest green", "a leafy sprout on top"), "r": ("indigo", "pointy cat-like ears"),
    "s": ("sea green", "one floppy ear and one upright ear"), "t": ("periwinkle blue", "two tiny horns and a tuft between them"), "u": ("coral peach", "a soft mohawk of short fur"),
    "v": ("grape purple", "two long droopy antennae"), "w": ("cyan blue", "four tiny rounded bumps on top"), "x": ("olive green", "two crossed little hair sprouts"),
    "y": ("blue-grey", "big round mouse-like ears"), "z": ("jade green", "a zigzag tuft of hair on top"),
}
MON = ("a small, round, chubby, very friendly baby monster made of fuzzy {col} felt, all one colour, with {feat}, two big shiny dark eyes with a white sparkle, rosy cheeks, "
       "{mouth}, two short stubby arms held out at its sides and two tiny feet. On its front is a very big, perfectly round, completely plain pale cream tummy patch that covers "
       "most of its lower body. The tummy patch is blank and empty: nothing on it, no letter, no mark, no belly button, and the arms do not cover it. Standing upright, facing the viewer straight on. Cute, never scary, no teeth.")
ROOM = ("In the same cut paper and gouache style as the reference picture, but an indoor scene with no characters and no animals: a cosy child's playroom seen straight on. "
        "The wall has soft pale blue-green wallpaper with faint vertical stripes on top and cream wooden panelling below. {window} {shelf} "
        "The bottom {floor} of the picture is a warm honey-coloured wooden plank floor, completely empty, with a white skirting board where the wall meets the floor in one straight level line. "
        "No rug, no furniture on the floor, no toys on the floor, no people. Calm and uncluttered.")
BOOKS["build"] = {
    "room-wide": dict(size="1536x1024", ref=["bobo/bg-day"], prompt=ROOM.format(window="On the right half of the wall, high up, is a white-framed window with coral curtains, looking out on green hills and a sunny sky.", shelf="On the left half of the wall, high up, is a small wooden shelf with a few colourful books, a little teddy bear and a striped ball.", floor="quarter")),
    "room-tall": dict(size="1024x1536", ref=["bobo/bg-day"], prompt=ROOM.format(window="In the middle of the wall, in the top third of the picture, is a white-framed window with coral curtains, looking out on green hills and a sunny sky.", shelf="There is no shelf.", floor="half")),
    "wood": dict(size="1024x1024", ref=["bobo/bg-day"], prompt="A flat, even, seamless texture that fills the whole picture edge to edge: the surface of a hand-painted wooden toy block in a pale cream-white colour, with soft gentle wood grain lines running sideways and a slightly uneven gouache paint feel. Very light and low contrast. No objects, no shapes, no shadows, no border, just the surface."),
}
# ---- Animal Band: each player is a head, a body without head or arms (the app draws the moving arms), and an instrument
HEAD = OBJ + "Only the head of the character in the reference picture, cut off cleanly under the chin: no neck, no body, no shoulders, no arms. Exactly the same face, colours and style, facing the viewer straight on, with a small happy smile."
SHUT = OBJ + "Exactly the same head as the reference picture, same size, colours and style, no body. The only change: both eyes are closed in two little curved lines, with a peaceful smile, as if resting."
BODY = OBJ + ("Only the body of the character in the reference picture, WITHOUT its head and WITHOUT its arms: a chubby rounded sitting torso in exactly the same fur colour, material and style, "
             "with the same pale tummy patch and two little feet at the bottom. The top of the torso is a smooth rounded shoulder shape with nothing above it: no head, no neck, no face, no arms, no hands.{extra}")
BOOKS["band"] = {}
for _id, _ref, _extra in [("bear", "bobo/bobo", ""), ("bunny", "bobo/bunny", " A small white fluffy tail shows at the left side."), ("fox", "bobo/fox", " A bushy orange tail with a white tip curls up at the left side."), ("frog", "bobo/frog", "")]:
    BOOKS["band"][_id + "-head"] = dict(size="1024x1024", alpha=True, max=512, ref=[_ref], prompt=HEAD)
    BOOKS["band"][_id + "-body"] = dict(size="1024x1024", alpha=True, max=512, ref=[_ref], prompt=BODY.format(extra=_extra))
for _id in ["bear", "bunny", "fox", "frog"]:
    BOOKS["band"][_id + "-head-shut"] = dict(size="1024x1024", alpha=True, max=512, ref=[_id + "-head"], prompt=SHUT)
_I = lambda text, size="1024x1024": dict(size=size, alpha=True, max=640, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + text + " No characters, no faces.")
BOOKS["band"].update({
    "bass": _I("a toy bass drum seen straight from the front: a big perfectly round cream drum skin with a big golden yellow star in the middle and a thick tomato-red rim, standing on two short dark legs."),
    "snare": _I("a small toy snare drum seen from the side, on a thin dark three-legged stand: a teal drum with a white zigzag pattern round it and a cream skin on top."),
    "cymbal": _I("one golden cymbal seen from the side, almost edge-on, so it is a thin, wide, flat golden lens shape with a small rounded dome in the middle. Only the cymbal: no stand, no stick.", "1536x1024"),
    "xframe": _I("the empty wooden frame of a toy xylophone seen from the front: two long horizontal honey-brown wooden rails, one above the other, joined at both ends and standing on four short legs. There are no bars on it.", "1536x1024"),
    "bar": _I("one single xylophone bar standing upright: a tall, narrow rounded rectangle of plain white felt, with a small dark round screw near the top and another near the bottom. Nothing else."),
    "horn": _I("a golden toy trumpet seen exactly from the side, lying level: the small mouthpiece at the far left, a straight tube with three little round valves on top, and the wide bell opening at the far right.", "1536x1024"),
    "uke": _I("a small wooden ukulele seen from the front, lying on its side: its rounded honey-brown body on the left with a dark round sound hole, its neck pointing to the right with four pale strings, and small tuning pegs at the far right end.", "1536x1024"),
})
# ---- Monster Kitchen: the things Munch eats (and the silly things he spits out), and the kitchen itself
FOOD = {
    "banana": "one ripe yellow banana, gently curved", "apple": "one shiny red apple with a short stalk and a green leaf", "strawberry": "one red strawberry with tiny pale seeds and a green leafy top",
    "orange": "one round orange with a tiny green leaf", "carrot": "one orange carrot with a green leafy top, lying at a slant", "cookie": "one round golden-brown cookie with dark chocolate chips",
    "pear": "one green pear with a short stalk", "lemon": "one bright yellow lemon", "tomato": "one round red tomato with a green star-shaped top",
    "cucumber": "one dark green cucumber lying at a slant", "eggplant": "one glossy purple aubergine with a green top", "donut": "one ring doughnut with pink icing and coloured sprinkles",
    "watermelon": "one triangular slice of watermelon, red with black seeds and a green rind", "grapes": "one bunch of purple grapes with a small green leaf", "broccoli": "one floret of green broccoli like a tiny tree",
    "cheese": "one wedge of yellow cheese with a few round holes", "shoe": "one child's red lace-up shoe seen from the side", "sock": "one teal sock with yellow stripes",
    "hat": "one blue woolly bobble hat", "ball": "one beach ball with red, yellow and blue segments", "sponge": "one yellow rectangular washing-up sponge with a green scouring top", "book": "one closed purple story book with a yellow star on the cover",
}
BOOKS["kitchen"] = {k: dict(size="1024x1024", alpha=True, max=384, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + v + ". No face, no characters.") for k, v in FOOD.items()}
KWALL = ("In the same cut paper and gouache style as the reference picture, but an indoor scene with no characters: the back wall of a cosy kitchen seen straight on, filling the whole picture. "
         "The top two thirds of the wall is warm cream wallpaper with faint vertical stripes; the bottom third is pale mint-green square tiles. {things} "
         "There is no counter, no table, no cupboards and no floor: the tiles run right to the bottom edge. Calm and uncluttered.")
BOOKS["kitchen"].update({
    "wall-wide": dict(size="1536x1024", ref=["bobo/bg-day"], prompt=KWALL.format(things="On the left, high up, is a white-framed window with coral curtains looking out on green hills. In the middle, high up, is a wooden shelf with two glass jars and a small plant in a pot. The right third of the wall is empty.")),
    "wall-tall": dict(size="1024x1536", ref=["bobo/bg-day"], prompt=KWALL.format(things="At the top is a white-framed window with coral curtains looking out on green hills. The rest of the wall is empty.")),
    "counter": dict(size="1536x1024", ref=["bobo/bg-day"], prompt="In the same cut paper and gouache style as the reference picture, but with no characters: the front of a kitchen counter seen straight on, filling the whole picture from edge to edge. Along the very top is a thick honey-coloured wooden worktop, a straight level band about one eighth of the picture tall. Below it, filling the rest, is a row of four wide teal cupboard doors, each with one small round yellow knob. No wall, no floor, nothing on the worktop."),
})
BOOKS["town"] = {
    "letter": dict(size="1024x1024", alpha=True, max=384, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one closed cream paper envelope seen from the front, with a red heart sticker sealing its flap. No face, no characters, no writing."),
    "balloon": dict(size="1024x1024", alpha=True, max=384, ref=["bobo/bobo"], prompt=OBJ + STYLEREF + "one round red party balloon with a small knot and a short curly string hanging below it. No face, no characters."),
}
BOOKS["paint"] = {
    "studio": dict(size="1536x1024", ref=["bobo/bg-day"], prompt="In the same cut paper and gouache style as the reference picture, but an indoor scene with no characters: the wall of a child's art studio seen straight on, filling the picture. Warm peach-cream wallpaper with faint vertical wooden plank lines. Along the very top hangs a string with a few small colourful children's paintings pegged to it. The bottom fifth of the picture is a warm wooden plank floor, with a straight level line where the wall meets the floor. The middle of the wall is completely plain and empty. No furniture, no easel, no people."),
}
# ---- faces: the heads used for player pictures, the hide-and-seek animals and the shopkeepers in Pip's Town
NEWHEAD = OBJ + STYLEREF + "only the head of {what}, with no neck, no body and no shoulders, facing the viewer straight on, with big shiny dark eyes with a white sparkle, rosy cheeks and a small happy smile. Just the head."
BOOKS["faces"] = {
    "panda": dict(size="1024x1024", alpha=True, max=384, ref=["star/panda"], prompt=HEAD), "cat": dict(size="1024x1024", alpha=True, max=384, ref=["star/cat"], prompt=HEAD), "owl": dict(size="1024x1024", alpha=True, max=384, ref=["star/owl"], prompt=HEAD),
    "lion": dict(size="1024x1024", alpha=True, max=384, ref=["bobo/bobo"], prompt=NEWHEAD.format(what="a friendly lion cub with golden yellow fur, a fluffy round orange-brown mane all the way round, small round ears and a cream muzzle")),
    "pig": dict(size="1024x1024", alpha=True, max=384, ref=["bobo/bobo"], prompt=NEWHEAD.format(what="a pink piglet with a round snout, small floppy ears and a white baker's hat")),
    "chick": dict(size="1024x1024", alpha=True, max=384, ref=["bobo/bobo"], prompt=NEWHEAD.format(what="a fluffy yellow chick with a small orange beak and a little tuft of feathers on top")),
    "mouse": dict(size="1024x1024", alpha=True, max=384, ref=["bobo/bobo"], prompt=NEWHEAD.format(what="a soft grey mouse with big round ears with pink insides, a pink nose, whiskers and a small blue postman's cap")),
    "hedgehog": dict(size="1024x1024", alpha=True, max=384, ref=["bobo/bobo"], prompt=NEWHEAD.format(what="a hedgehog with a cream face, a small dark nose and soft brown rounded spikes all round the back of its head")),
    "dog": dict(size="1024x1024", alpha=True, max=384, ref=["bobo/bobo"], prompt=NEWHEAD.format(what="a tan puppy with floppy brown ears, a cream muzzle and a dark nose")),
    "felt": dict(size="1024x1024", ref=["bobo/bg-day"], prompt="A flat, even, seamless texture that fills the whole picture edge to edge: soft pale cream-white wool felt seen close up, with a gentle fuzzy fibre feel and very slight uneven shading. Very light and low contrast. No objects, no shapes, no stitches, no border, just the felt surface."),
}
for _id in ["panda", "cat", "owl", "lion", "pig", "chick", "mouse", "hedgehog", "dog"]:
    BOOKS["faces"][_id + "-shut"] = dict(size="1024x1024", alpha=True, max=384, ref=[_id], prompt=SHUT)
# ---- the pictures for the three-letter words in Letter Monsters that have no picture yet
_W = lambda text: dict(size="1024x1024", alpha=True, max=448, ref=["bobo/bobo"], prompt=CUT.replace("One single character", "One single thing") + STYLEREF + text)
BOOKS["words"] = {
    "pig": _W("a small chubby pink piglet with a round snout, floppy ears, a curly tail, big shiny eyes and rosy cheeks, standing upright, facing the viewer."),
    "dog": _W("a small tan puppy with floppy brown ears, a cream muzzle and tummy, a wagging tail, big shiny eyes and rosy cheeks, sitting upright, facing the viewer."),
    "cow": _W("a small chubby white calf with black patches, a pink muzzle, tiny horns, big shiny eyes and rosy cheeks, standing upright, facing the viewer."),
    "bus": _W("a cheerful yellow toy school bus seen exactly from the side, facing right, with three square windows, a red stripe, two dark wheels and a friendly smiling face at the front. No people inside."),
    "egg": _W("one big smooth cream-white egg standing upright, with a few pale freckles and a small smiling face (two dot eyes, rosy cheeks). Not cracked."),
    "egg-open": _W("a fluffy yellow baby chick, smiling with a tiny orange beak, popping out of the bottom half of a cracked cream-white eggshell, with a small piece of shell on its head like a hat."),
}
BOOKS["letters"] = {}
for ch, (col, feat) in MONSTERS.items():
    BOOKS["letters"][ch] = dict(size="1024x1024", alpha=True, max=512, ref=["pip/pip"], prompt=CUT + STYLEREF + MON.format(col=col, feat=feat, mouth="a small closed smile"))
for ch in MONSTERS:
    BOOKS["letters"][ch + "-open"] = dict(size="1024x1024", alpha=True, max=512, ref=[ch], prompt=CUT + SAME + "Same pose, same size, same blank cream tummy patch. The only change: its mouth is now wide open in a happy round shape, as if it is singing a sound, showing a little pink tongue.")


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
            m = BOOKS[book][name].get("max")
            if m and max(img.size) > m: img.thumbnail((m, m), Image.LANCZOS)
        else: img = img.convert("RGB")
        img.save(path, "WEBP", quality=88, method=6)
        print(f"made {name} {img.size} mode={img.mode} ~${cost:.3f} usage={json.dumps(usage)}", flush=True)
    print(f"total ~${total:.2f}")


if __name__ == "__main__":
    main()
