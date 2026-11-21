#!/usr/bin/env python3
"""Check shipped assets and every narration byte range without network access."""
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import build


def main():
    errors = []
    for path in build.JS + build.CSS:
        for match in re.finditer(r'''["']((?:img|films|voice|fonts)/[^"']+\.(?:webp|png|jpg|mp4|mp3|woff2))["']''', build.read(path)):
            if not (ROOT / match[1]).is_file():
                errors.append(f'{path}: missing {match[1]}')
    index = json.loads((ROOT / 'voice/index.json').read_text())
    for key, ref in index.items():
        if not isinstance(ref, list) or len(ref) != 3:
            errors.append('Invalid voice index entry'); continue
        bundle, offset, length = ref
        if not isinstance(bundle, str) or not re.fullmatch(r'[a-zA-Z0-9_-]+', bundle):
            errors.append('Invalid voice bundle ID'); continue
        path = ROOT / 'voice' / (bundle + '.mp3')
        if not all(isinstance(n, int) for n in (offset, length)) or offset < 0 or length <= 0 or not path.is_file() or offset + length > path.stat().st_size:
            errors.append(f'Invalid byte range in bundle {bundle}')
    for film in json.loads((ROOT / 'films/index.json').read_text()):
        for ext in ('jpg', 'mp4'):
            if not (ROOT / 'films' / (film['id'] + '.' + ext)).is_file():
                errors.append(f'Missing story film asset: {film["id"]}.{ext}')
    build.activity_catalog()  # metadata must be complete and IDs unique
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'Assets passed; {len(index)} narration ranges checked')


if __name__ == '__main__':
    main()
