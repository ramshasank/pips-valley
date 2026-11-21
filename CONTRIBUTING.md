# Contributing to Pip's Valley

The app ships as plain HTML, CSS and JavaScript. Node packages are development tools;
children do not download a framework or connect to an API to play.

## Start locally

Use Python 3.10 or later and Node.js 22 or later.

```sh
npm ci --ignore-scripts
npx playwright install chromium
python3 -m http.server 8000
```

Open `http://localhost:8000`. The app fits phones and tablets; also check a narrow
portrait screen, a large landscape screen, keyboard input and sound turned off.

## Make a change

- A game lives in `games/` and registers through `K.game`. Keep its registration
  metadata as literal strings and numbers so the build can create the loading catalog.
- Share drawn artwork through `art/` and engine behavior through `engine/`.
- Use `ctx.wait`, `ctx.after`, `ctx.every` and `ctx.onExit` for activity work so leaving
  a screen stops it. Supply a keyboard action and a useful label for interactive nodes.
- Games should welcome experimentation. Avoid losing states, scores, countdowns,
  blame, advertisements and purchases.
- Use recorded prompts where possible. See [the voice workflow](docs/VOICE.md).
- Keep private names, home paths, recordings of real children, credentials and local
  configuration out of commits. Use invented player names in tests.

After editing code or styles, regenerate the entry point and run the checks:

```sh
python3 build.py --web-only
npm run check
python3 -m unittest discover -s tests -p 'test_*.py'
npm run test:browser
```

The browser suite checks all activities, painting persistence and loading recovery.
Add regression checks for behavior you fix. Include the behavior before and after
your change, how you tested it, and screenshots when a visual change warrants them.

## Distribution and licensing

`python3 build.py` creates `dist/playhouse.html` and copies the images, recordings,
films and licenses it needs. Serve or distribute the **entire `dist/` folder**.
The HTML combines code and fonts; media remains in adjacent folders to avoid a very
large encoded document. Opening from `file://` does not support recorded speech;
use a local HTTP server. The project has no offline service worker.

Code is MIT licensed. Art, characters, stories and generated recordings use
CC BY 4.0; fonts retain their SIL OFL license. Preserve attribution and disclose
AI-generated voice and images when sharing them.
