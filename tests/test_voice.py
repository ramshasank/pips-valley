import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('voice_tool', Path(__file__).resolve().parents[1] / 'tools/voice.py')
voice = importlib.util.module_from_spec(spec)
spec.loader.exec_module(voice)


class VoiceWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.root = Path(self.folder.name)
        (self.root / 'voice').mkdir()
        (self.root / 'tools').mkdir()
        self.lines = [dict(key='hello', text='Hello!', who='', bundle='core'), dict(key='you did it', text='You did it!', who='', bundle='core')]
        (self.root / 'voice/lines.json').write_text(json.dumps(self.lines))
        self.original = json.dumps({'hello': ['core', 0, 4], 'you did it': ['core', 4, 4]})
        (self.root / 'voice/index.json').write_text(self.original)
        (self.root / 'tools/voice_styles.json').write_text(json.dumps(dict(narrator='Warm narrator', celebration='Celebrate effort', monster='Friendly monster', bedtime='Calm story')))
        self.root_patch = patch.object(voice, 'ROOT', self.root)
        self.root_patch.start()

    def tearDown(self):
        self.root_patch.stop()
        self.folder.cleanup()

    def run_cli(self, *args):
        with patch('sys.argv', ['voice.py', '--bundle', 'core', '--model', 'test-model', *args]), patch('builtins.print'):
            voice.main()

    def test_dry_run_never_calls_api_or_changes_files(self):
        with patch.object(voice.urllib.request, 'urlopen', side_effect=AssertionError('Unexpected API call')):
            self.run_cli()
        self.assertEqual((self.root / 'voice/index.json').read_text(), self.original)
        self.assertFalse((self.root / 'voice/.cache').exists())

    def test_incomplete_cache_never_changes_published_index(self):
        with self.assertRaisesRegex(SystemExit, 'missing'):
            self.run_cli('--publish')
        self.assertEqual((self.root / 'voice/index.json').read_text(), self.original)

    def test_reviewed_cache_publishes_versioned_bundle_and_correct_ranges_without_api(self):
        styles = json.loads((self.root / 'tools/voice_styles.json').read_text())
        cache = self.root / 'voice/.cache'; cache.mkdir()
        clips = [b'first-clip', b'second-clip']
        for line, clip in zip(self.lines, clips):
            body = voice.payload(line, 'test-model', 'marin', styles)
            (cache / (voice.cache_key(body) + '.mp3')).write_bytes(clip)
        with patch.object(voice.urllib.request, 'urlopen', side_effect=AssertionError('Unexpected API call')):
            self.run_cli('--publish')
        index = json.loads((self.root / 'voice/index.json').read_text())
        bundle = index['hello'][0]
        self.assertTrue(bundle.startswith('core-'))
        self.assertEqual(index['hello'][1:], [0, len(clips[0])])
        self.assertEqual(index['you did it'][1:], [len(clips[0]), len(clips[1])])
        self.assertEqual((self.root / 'voice' / (bundle + '.mp3')).read_bytes(), b''.join(clips))

    def test_new_directions_invalidate_preview_cache(self):
        base = dict(model='test-model', voice='marin', input='Hello!', instructions='Warm')
        changed = dict(base, instructions='Calm')
        self.assertNotEqual(voice.cache_key(base), voice.cache_key(changed))


if __name__ == '__main__':
    unittest.main()
