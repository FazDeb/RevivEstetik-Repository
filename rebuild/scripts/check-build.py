from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
ROOT=Path(__file__).resolve().parents[1]/'dist'
class Links(HTMLParser):
    def __init__(self): super().__init__(); self.links=[]; self.h1=0
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='h1':self.h1+=1
        for key in ['src','href']:
            if key in attrs:self.links.append(attrs[key])
pages=list(ROOT.rglob('*.html'))
assert len(pages)==29, f'Expected 29 pages, found {len(pages)}'
for file in pages:
    parser=Links(); parser.feed(file.read_text(encoding='utf-8'))
    if ROOT/'admin' not in file.parents:
        assert parser.h1==1, f'{file}: expected one h1'
    for link in parser.links:
        url=urlsplit(link)
        if url.scheme or url.netloc or not url.path or not url.path.startswith('/'):continue
        target=ROOT/unquote(url.path).lstrip('/')
        assert target.is_file() or (target/'index.html').is_file(), f'{file}: missing {link}'
print(f'Checked {len(pages)} pages: headings, internal links and local assets pass.')
