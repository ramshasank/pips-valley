#!/usr/bin/env python3
"""Preview and publish expressive, pre-recorded speech. Dry-run is the default.

Requires OPENAI_API_KEY only for --generate. No secrets or machine data enter assets.
See docs/VOICE.md for the preview-first workflow and API documentation.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent


def delivery(line):
    if line.get('who') == 'monster':
        return 'monster'
    if re.search(r'good night|sleep|bedtime', line['text'], re.I):
        return 'bedtime'
    if re.search(r'great job|you did it|hooray|wonderful|high five|awesome|fantastic', line['text'], re.I):
        return 'celebration'
    return 'narrator'


def payload(line, model, voice, styles):
    return dict(model=model, voice=voice, input=line['text'], instructions=styles[delivery(line)], response_format='mp3')


def cache_key(body):
    return hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()


def atomic_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as f:
        temp = Path(f.name)
        try:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        except BaseException:
            temp.unlink(missing_ok=True)
            raise
    os.replace(temp, path)


def generate(body, target, key):
    request = urllib.request.Request('https://api.openai.com/v1/audio/speech',
        data=json.dumps(body).encode(), headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            audio = response.read()
    except urllib.error.HTTPError as e:
        raise SystemExit(f'Speech service returned HTTP {e.code}; no recording was published.') from None
    except (urllib.error.URLError, TimeoutError):
        raise SystemExit('Speech service is unavailable; no recording was published.') from None
    if not audio:
        raise SystemExit('Speech service returned empty audio.')
    with tempfile.TemporaryDirectory() as folder:
        raw, normal = Path(folder) / 'raw.mp3', Path(folder) / 'normal.mp3'
        raw.write_bytes(audio)
        result = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(raw), '-af', 'loudnorm=I=-18:TP=-2:LRA=9',
            '-ar', '24000', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '96k', '-write_xing', '0', str(normal)], capture_output=True)
        if result.returncode:
            raise SystemExit('Audio processing failed; no recording was published.')
        atomic_write(target, normal.read_bytes())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', required=True, help='recording bundle, for example core or feed')
    parser.add_argument('--model', required=True, help='an available speech model that supports instructions')
    parser.add_argument('--voice', default='marin')
    parser.add_argument('--limit', type=int, help='preview only this many lines')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--generate', action='store_true', help='make billable API calls for uncached public lines')
    mode.add_argument('--publish', action='store_true', help='publish an entire bundle from already reviewed cached clips; no API calls')
    args = parser.parse_args()
    if args.limit is not None and args.limit < 1:
        parser.error('--limit must be positive')
    if args.publish and args.limit:
        parser.error('publish requires a complete bundle; omit --limit')
    if not re.fullmatch(r'[a-zA-Z0-9_-]+', args.bundle):
        parser.error('invalid bundle ID')
    manifest = ROOT / 'voice/lines.json'
    if not manifest.exists():
        raise SystemExit('First run node tools/collect-lines.cjs with the app served locally.')
    index = json.loads((ROOT / 'voice/index.json').read_text())
    all_lines = json.loads(manifest.read_text())
    lines = [line for line in all_lines if line['bundle'] == args.bundle]
    if not lines:
        raise SystemExit('That bundle has no lines.')
    if args.limit:
        lines = lines[:args.limit]
    styles = json.loads((ROOT / 'tools/voice_styles.json').read_text())
    jobs = [(line, payload(line, args.model, args.voice, styles)) for line in lines]
    cache = ROOT / 'voice/.cache'
    print(f"{len(jobs)} lines; {sum(len(line['text']) for line, _ in jobs)} characters; voice {args.voice}")
    if not args.generate and not args.publish:
        print('Dry run: no API calls and no files changed. Use --generate for previews.')
        return
    if args.generate:
        key = os.environ.get('OPENAI_API_KEY', '')
        if not key:
            raise SystemExit('Set OPENAI_API_KEY in your local environment. Never put it in a file or chat.')
        for line, body in jobs:
            target = cache / (cache_key(body) + '.mp3')
            if not target.exists():
                generate(body, target, key)
        preview = ROOT / 'voice/previews' / args.bundle
        preview.mkdir(parents=True, exist_ok=True)
        for n, (_, body) in enumerate(jobs):
            atomic_write(preview / f'{n + 1:04}.mp3', (cache / (cache_key(body) + '.mp3')).read_bytes())
        atomic_write(preview / 'lines.json', json.dumps([line for line, _ in jobs], indent=2).encode())
        print('Preview clips are ready under voice/previews. Listen before publishing.')
        return
    expected = {key for key, ref in index.items() if ref[0] == args.bundle or key in {line['key'] for line in lines}}
    if {line['key'] for line in lines} != expected:
        raise SystemExit('Manifest does not cover the entire bundle. Collect lines again.')
    clips = []
    for _, body in jobs:
        path = cache / (cache_key(body) + '.mp3')
        if not path.exists():
            raise SystemExit('Some preview clips are missing. Generate and review the full bundle first.')
        clips.append(path.read_bytes())
    audio = b''.join(clips)
    bundle = args.bundle + '-' + hashlib.sha256(audio).hexdigest()[:10]
    atomic_write(ROOT / 'voice' / (bundle + '.mp3'), audio)
    offset = 0
    for (line, _), clip in zip(jobs, clips):
        index[line['key']] = [bundle, offset, len(clip)]
        offset += len(clip)
    atomic_write(ROOT / 'voice/index.json', (json.dumps(index, indent=2) + '\n').encode())
    print('Reviewed bundle published. Rebuild and run the checks before sharing.')


if __name__ == '__main__':
    main()
