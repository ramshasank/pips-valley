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
| Game Room | 32 small games in the red barn, for ages 3 to 8 (see below) |

### The Game Room

The barn holds 32 games you can browse by age and by subject. Each has three levels that follow the player's age band and gets a little harder as the child succeeds. The learning is the play itself: children share out a pizza, hop a frog along a number line, pay with coins, pour paint.

| Age | Maths | Words | Thinking and memory | Science and feelings | Music, coding, fun |
|---|---|---|---|---|---|
| 3 and up | Shape Sorter, Count the Eggs, Big and Small | | Hide and Seek, Tidy Up | Colour Mixer, Happy or Sad? | Bubble Pop, Peek-a-Boo Garden |
| 5 and up | Number Rocket, Pattern Train, Dot to Dot, Make Ten, Frog Hops, Pip's Shop | Word Builder, First Sounds, Rhyme Time | Odd One Out, Jigsaw, Memory Match | Sink or Float | Copy the Tune |
| 7 and up | Tick Tock Clock, Number Blocks, Times Garden, Pizza Party | Build a Sentence | Picture Sudoku, Maze Run, Treasure Map | | Robot Path |

Nobody can lose. There are no timers and no scores. If a child is stuck, a paper hand shows the move.

## Privacy

There is no tracking and there are no accounts. Player names, progress and paintings
stay in this browser's storage. Recorded audio and artwork come from the site host;
missing speech may use the device's speech service. See [PRIVACY.md](PRIVACY.md).

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
Games load when they are needed. The build also writes combined code and fonts to
`dist/playhouse.html` and copies its media alongside it. Distribute the entire
`dist/` folder and serve it over HTTP; the HTML alone does not contain its media.
Use `python3 build.py --web-only` to skip that distribution copy.

## Development and voice

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, checks and the activity
contract. Continuous integration checks the build, narration assets, profiles,
speech cancellation, all 41 activities, painting persistence and loading recovery.
The playable app still has no package dependencies.

The grown-ups panel offers Playful and Gentle speech delivery. Existing recorded
voices keep their character; [docs/VOICE.md](docs/VOICE.md) explains how to preview
and produce warmer replacement recordings without putting API keys in the app.

## Licence

- Code: [MIT](LICENSE).
- Drawings, stories and characters: [CC BY 4.0](LICENSE-ART.md). Share and adapt them, with credit.
- The pictures in `img/` (Pip, the letter monsters, the story books, the band, the kitchen and the playroom) were generated with an OpenAI image model and are shared under the same CC BY 4.0 terms.
- The story films in `films/` were animated with [HyperFrames](https://github.com/heygen-com/hyperframes) from the same pictures and are shared under CC BY 4.0.
- Fonts: Andika and Fraunces, under the [SIL Open Font License](fonts/OFL.txt).
- The spoken lines in `voice/` and the narration of the story films are an AI-generated voice, made with OpenAI's speech model (the "sage" voice). They are shared under the same CC BY 4.0 terms.
