"""Build the main site and a separate URL for each version-N branch."""
import re
import json
import subprocess
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / '_site'

def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])

def export(ref, destination):
    files = git('ls-tree', '-rz', '--name-only', ref).decode().split('\0')
    referenced_images = set()
    if 'data/content.json' in files:
        catalog = json.loads(git('show', f'{ref}:data/content.json'))
        referenced_images = {row['image'] for group in ('products', 'menu', 'events') for row in catalog[group]}
    for name in filter(None, files):
        path = PurePosixPath(name)
        allowed = (len(path.parts) == 1 and path.suffix in {'.html', '.css', '.js'}) or (
            path.parts[0] == 'assets' and path.suffix in {'.webp', '.svg', '.ttf', '.woff', '.woff2', '.png', '.jpg', '.jpeg', '.gif'}) or name == 'data/content.json' or name in referenced_images
        if allowed:
            target = destination / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(git('show', f'{ref}:{name}'))
    if not (destination / 'index.html').exists():
        raise RuntimeError(f'Missing index.html in {ref}')

if OUTPUT.exists() and any(OUTPUT.iterdir()):
    raise RuntimeError('Use an empty _site directory for a clean build.')
OUTPUT.mkdir(exist_ok=True)
refs = git('for-each-ref', '--format=%(refname)', 'refs/remotes/origin', 'refs/heads').decode().splitlines()
main = 'refs/remotes/origin/main' if 'refs/remotes/origin/main' in refs else 'refs/heads/main'
export(main, OUTPUT)
versions = {}
for ref in refs:
    match = re.fullmatch(r'refs/(?:heads|remotes/origin)/version-([1-9][0-9]*)', ref)
    if match:
        versions[match[1]] = ref
for version, ref in sorted(versions.items(), key=lambda pair: int(pair[0])):
    export(ref, OUTPUT / f'v{version}')
(OUTPUT / '.nojekyll').touch()
print(f'Built main and {len(versions)} version(s): ' + ', '.join('v' + v for v in versions))
