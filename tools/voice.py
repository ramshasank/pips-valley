#!/usr/bin/env python3
"""Preview and publish expressive, pre-recorded speech. Dry-run is the default.

Requires OPENAI_API_KEY only for --generate. No secrets or machine data enter assets.
See docs/VOICE.md for the preview-first workflow and API documentation.
"""
import argparse
import hashlib
import html
import json
import os
from pathlib import Path
import re
import shutil
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


def preview_lines(lines, limit):
    """A small audition should sample different deliveries rather than five cheers."""
    if not limit:
        return lines
    selected, seen = [], set()
    for line in lines:
        style = delivery(line)
        if style not in seen and len(selected) < limit:
            selected.append(line)
            seen.add(style)
    for line in lines:
        if len(selected) >= limit:
            break
        if line not in selected:
            selected.append(line)
    return selected


def audition_page(title, content):
    return f'''<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<style>body{{font:18px/1.5 system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;background:#fbf6ec;color:#2e2a3b}}section{{padding:20px;margin:20px 0;background:white;border-radius:16px}}h2{{font-size:22px}}audio{{width:100%}}a{{color:#17645f}}.meta{{font-size:14px}}</style>
<h1>{html.escape(title)}</h1>{content}</html>'''


def write_audition(preview_root, lines, jobs, voice, model, cache):
    digest = hashlib.sha256(''.join(cache_key(body) for _, body in jobs).encode()).hexdigest()[:10]
    name = re.sub(r'[^a-zA-Z0-9_-]', '_', voice)[:32] + '-' + digest
    preview = preview_root / name
    content = f'<p>{html.escape(voice)} · {html.escape(model)}</p><p>Listen for warmth, clarity, comfortable volume and natural pauses. These recordings are AI generated.</p>'
    for n, (line, body) in enumerate(jobs, 1):
        atomic_write(preview / f'{n:04}.mp3', (cache / (cache_key(body) + '.mp3')).read_bytes())
        content += f'<section><h2>{html.escape(line["text"])}</h2><p class="meta">{html.escape(delivery(line))}</p><audio controls preload="none" src="{n:04}.mp3" aria-label="Sample {n}"></audio></section>'
    atomic_write(preview / 'lines.json', json.dumps(lines, indent=2).encode())
    atomic_write(preview / 'metadata.json', json.dumps(dict(voice=voice, model=model, count=len(lines))).encode())
    atomic_write(preview / 'index.html', audition_page('Voice audition', content).encode())
    overview = '<p>Compare the first sample of each performance, then listen to the complete audition. Keep listening volume comfortable.</p>'
    for folder in sorted(preview_root.iterdir()):
        metadata = folder / 'metadata.json'
        if not folder.is_dir() or not metadata.is_file():
            continue
        info = json.loads(metadata.read_text())
        url = html.escape(folder.name, quote=True)
        overview += f'<section><h2>{html.escape(info["voice"])}</h2><p class="meta">{html.escape(info["model"])} · {info["count"]} samples</p><audio controls preload="none" src="{url}/0001.mp3" aria-label="{html.escape(info["voice"], quote=True)} preview"></audio><p><a href="{url}/index.html">Listen to the complete audition</a></p></section>'
    atomic_write(preview_root / 'index.html', audition_page('Compare voices', overview).encode())


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
    parser.add_argument('--model', help='an available speech model that supports instructions; required except for --baseline')
    parser.add_argument('--voice', default='marin')
    parser.add_argument('--limit', type=int, help='preview only this many lines')
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--generate', action='store_true', help='make billable API calls for uncached public lines')
    mode.add_argument('--publish', action='store_true', help='publish an entire bundle from already reviewed cached clips; no API calls')
    mode.add_argument('--baseline', action='store_true', help='audition existing public recordings without an API key')
    args = parser.parse_args()
    if not args.baseline and not args.model:
        parser.error('--model is required except when preparing a baseline')
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
    lines = preview_lines(lines, args.limit)
    styles = json.loads((ROOT / 'tools/voice_styles.json').read_text())
    voice_name = 'Current recording (baseline)' if args.baseline else args.voice
    model_name = 'Existing release' if args.baseline else args.model
    jobs = [(line, payload(line, model_name, voice_name, styles)) for line in lines]
    cache = ROOT / 'voice/.cache'
    print(f"{len(jobs)} lines; {sum(len(line['text']) for line, _ in jobs)} characters; voice {voice_name}")
    if args.baseline:
        for line, body in jobs:
            ref = index.get(line['key'])
            if not ref:
                raise SystemExit('A baseline recording is missing. Collect lines again.')
            bundle, offset, length = ref
            audio = (ROOT / 'voice' / (bundle + '.mp3')).read_bytes()[offset:offset + length]
            atomic_write(cache / (cache_key(body) + '.mp3'), audio)
        write_audition(ROOT / 'voice/previews' / args.bundle, lines, jobs, voice_name, model_name, cache)
        print('Existing recordings are ready to audition. No API calls or published recordings changed.')
        return
    if not args.generate and not args.publish:
        print('Dry run: no API calls and no files changed. Use --generate for previews.')
        return
    if args.generate:
        if not shutil.which('ffmpeg'):
            raise SystemExit('Install FFmpeg before generating previews.')
        key = os.environ.get('OPENAI_API_KEY', '')
        if not key:
            raise SystemExit('Set OPENAI_API_KEY in your local environment. Never put it in a file or chat.')
        for line, body in jobs:
            target = cache / (cache_key(body) + '.mp3')
            if not target.exists():
                generate(body, target, key)
        write_audition(ROOT / 'voice/previews' / args.bundle, lines, jobs, args.voice, args.model, cache)
        print('Open voice/previews/' + args.bundle + '/index.html on your local server to compare performances. Listen before publishing.')
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
