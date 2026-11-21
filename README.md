# Pip's Valley

A free play-and-learn toy box for young children (about ages 3 to 8), made of cut paper.
It runs in the browser on any phone or tablet. Nothing to install, no sign-in, no ads.

**Play it here: https://ramshasank.github.io/pips-valley/**

On a phone or tablet you can also choose "Add to Home Screen" in the browser menu, and it opens like an app.

## What's inside

Pip lives in a little valley. Each place in the valley is a toy:

| Toy | What a child does |
|---|---|
| Monster Kitchen | Feed a hungry monster the food it asks for |
| Paint Studio | Pour or brush colour into pictures, and mix new colours |
| Build It | Stack wooden blocks, follow a plan, knock it all down |
| Letter Monsters | Meet the letters, trace them, and build small words |
| Animal Band | Play drums, xylophone, trumpet and ukulele with the animals |
| Story Studio | Act out three picture books with taps, swipes and holds |
| Pip's Town | Drive a delivery van along the street |
| Story Time | Watch 22 short narrated story films about sharing, trying again, telling the truth and bedtime |

Nobody can lose. There are no timers and no scores. If a child is stuck, a paper hand shows the move.

## Privacy

The app never sends anything anywhere. There is no tracking and there are no accounts.
Player names, stickers, paintings and builds are kept only on the device, in the browser's own storage.

## Early version

This is an early version. It has not yet been tested much with real children on real devices.
Known gaps: sounds are simple synthesised tones, a phone held sideways only shows a "turn me upright" card,
and any line without a recording falls back to the device's own speech voice.

## Run it yourself

It is plain HTML, CSS and JavaScript with no dependencies.

```
python3 -m http.server 8000     # then open http://localhost:8000
```

After adding or removing a script file, run `python3 build.py` to regenerate `index.html`.
It also writes the whole app as one file to `dist/playhouse.html`.

## Licence

- Code: [MIT](LICENSE).
- Drawings, stories and characters: [CC BY 4.0](LICENSE-ART.md). Share and adapt them, with credit.
- The pictures in `img/` (Pip, the letter monsters, the story books, the band, the kitchen and the playroom) were generated with an OpenAI image model and are shared under the same CC BY 4.0 terms.
- The story films in `films/` were animated with [HyperFrames](https://github.com/heygen-com/hyperframes) from the same pictures and are shared under CC BY 4.0, except for their narration (see the voice note below).
- Fonts: Andika and Fraunces, under the [SIL Open Font License](fonts/OFL.txt).
- The spoken lines in `voice/` were generated with Fish Audio S2 Pro. Fish Audio's model licence allows research and non-commercial use only, so the voice clips are **not** covered by the MIT or CC BY licences above: do not use them commercially.
