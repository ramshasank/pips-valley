# A voice that invites children to play

The goal is a kind, expressive picture-book storyteller: clear and conversational,
curious during discovery, delighted by effort and calm when a child needs help.
Avoid shouting, exaggerated squeaks, forced laughter and long pauses. Character
voices should feel friendly and consistent. Quiet moments matter as much as energy.

## What the player hears

The app prefers complete recorded lines, then recorded sentences, then device
speech. Recorded sentences use shorter pauses in Playful mode and more breathing
room in Gentle mode. The backup voice uses subtle pacing and pitch changes.
Idle reminders wait 22 seconds and never interrupt speech already in progress.
The speaker button always lets the child ask again.

Choose Playful or Gentle under the grown-ups settings. This changes playback pacing
and device speech; it does not replace or transform the voice in existing MP3s.
Story films have their own baked-in narration and need a separate video production
pass to replace that narration.

## Generate previews first

The generator is a maintainer tool. The playable site contains no API key and makes
no live speech-generation requests. A key belongs only in the maintainer's local
environment or secret manager; never paste it into chat, source code or a web form
in this app.

1. Install the development tools described in [CONTRIBUTING.md](../CONTRIBUTING.md)
   and FFmpeg. Serve the app locally with `python3 -m http.server 8000`.
2. Extract public authored lines into a fresh browser context:

   ```sh
   node tools/collect-lines.cjs
   ```

   This reads authored game text and the existing voice index, never a child's
   profile or saved settings. Inspect `voice/lines.json`, especially reconstructed
   lines that no longer have matching authored text. Correct punctuation and
   pronunciation before generating them.
3. Consult the current [OpenAI speech documentation](https://developers.openai.com/api/docs/guides/text-to-speech).
   Pick an available model supporting `instructions`. The CLI requires `--model`
   rather than silently committing the project to a model that may retire.
   Built-in voice `marin` is the default candidate; compare it with `cedar` before
   selecting the final voice. Style directions live in `tools/voice_styles.json`.
4. Set `OPENAI_API_KEY` privately in your local environment. With your chosen model
   substituted for `MODEL_ID`, inspect the dry run, then explicitly generate a few
   previews. Generation calls the paid speech endpoint.

   ```sh
   python3 tools/voice.py --bundle core --model MODEL_ID --limit 5
   python3 tools/voice.py --bundle core --model MODEL_ID --limit 5 --generate
   ```

5. Listen to the numbered clips in `voice/previews/core/`. Cached clips and previews
   are ignored by Git. Check warmth, pronunciation, natural pauses, comfortable
   volume and whether encouragement sounds sincere. Listen on a phone speaker.
   Check with adults first, then get feedback from children with their caregivers.
6. After choosing a voice and directions, generate the complete bundle without
   `--limit`. Review all clips. Publish from the reviewed cache:

   ```sh
   python3 tools/voice.py --bundle core --model MODEL_ID --generate
   python3 tools/voice.py --bundle core --model MODEL_ID --publish
   python3 build.py --web-only
   npm run check
   npm run test:browser
   ```

Publishing makes no API calls. It writes a new versioned MP3 before atomically
updating the byte index, so existing recordings remain available. It refuses to
publish a partial bundle. New clips are normalized with FFmpeg to -18 LUFS with a
-2 dB true-peak target. Listen for abrupt joins and fatigue; an automated loudness
target alone does not establish suitable listening volume on every device.

The initial engineering changes do **not** regenerate the existing 2,225 recordings.
Preview and voice selection are separate from playback improvements. Recordings
are AI generated; keep that disclosure in the README and grown-ups panel.
