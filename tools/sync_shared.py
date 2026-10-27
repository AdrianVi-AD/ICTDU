"""Regenerate shared static markup without introducing a browser dependency."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def active_header(header, page):
    def update(match):
        tag = match.group(0)
        if 'nav-link' not in tag or f'href="{page}"' not in tag:
            return tag
        tag = re.sub(r'class="([^"]*)"', lambda m: f'class="{m.group(1)} active"', tag)
        return tag[:-1] + ' aria-current="page">'
    return re.sub(r'<a\b[^>]*>', update, header)

def replace_region(source, label, content):
    pattern = rf'<!-- Shared {label} start -->.*?<!-- Shared {label} end -->'
    replacement = f'<!-- Shared {label} start -->\n{content.strip()}\n<!-- Shared {label} end -->'
    result, count = re.subn(pattern, lambda _: replacement, source, flags=re.S)
    if count != 1:
        raise ValueError(f'Expected one shared {label} region; found {count}')
    return result

def main():
    partials = {name: (ROOT / 'partials' / f'{name}.html').read_text(encoding='utf-8') for name in ('header', 'footer', 'contact-form')}
    for path in sorted(ROOT.glob('*.html')):
        source = path.read_text(encoding='utf-8')
        source = replace_region(source, 'header', active_header(partials['header'], path.name))
        source = replace_region(source, 'footer', partials['footer'])
        if '<!-- Shared contact form start -->' in source:
            source = replace_region(source, 'contact form', partials['contact-form'])
        path.write_text(source, encoding='utf-8', newline='\n')
        print('Updated', path.name)

if __name__ == '__main__':
    main()
