"""Automated SEO checks for markeyhomebuyers.com. Run from the repo root: python3 _tools/seo_check.py
Exit code 1 if any error is found. (Folders starting with _ are not published by GitHub Pages/Jekyll.)"""
import re, sys, pathlib, html
root = pathlib.Path(__file__).resolve().parent.parent
errors, warns = [], []
pages = [p for p in root.rglob('*.html') if '.git' not in p.parts and '_tools' not in p.parts]
sitemap = set(re.findall(r'<loc>https://markeyhomebuyers\.com/([^<]*)</loc>', (root/'sitemap.xml').read_text()))
titles = {}
for p in pages:
    rel = str(p.relative_to(root)); t = p.read_text(errors='ignore')
    if 'http-equiv="refresh"' in t:      # redirect stub
        continue
    noindex = re.search(r'<meta name="robots" content="[^"]*noindex', t)
    title = re.search(r'<title>(.*?)</title>', t, re.S)
    desc = re.search(r'<meta name="description" content="([^"]*)"', t)
    if not title: errors.append(f'{rel}: missing <title>')
    else:
        tt = html.unescape(title.group(1)).strip()
        if len(tt) > 60: warns.append(f'{rel}: title {len(tt)} chars')
        titles.setdefault(tt, []).append(rel)
    if not desc: errors.append(f'{rel}: missing meta description')
    elif len(html.unescape(desc.group(1))) > 160: warns.append(f'{rel}: description {len(html.unescape(desc.group(1)))} chars')
    if not re.search(r'<link rel="canonical"', t): errors.append(f'{rel}: missing canonical')
    h1 = len(re.findall(r'<h1[\s>]', t))
    if h1 != 1 and not noindex: errors.append(f'{rel}: {h1} H1 tags')
    for href in re.findall(r'href="([^"#?]+)', t):
        if href.startswith(('http', 'mailto:', 'tel:', 'sms:')) or not href.endswith('.html') and href != '/': continue
        target = root/'index.html' if href == '/' else (root/href.lstrip('/') if href.startswith('/') else p.parent/href)
        if not target.exists(): errors.append(f'{rel}: broken link {href}')
    in_map = (rel if rel != 'index.html' else '') in sitemap
    if noindex and in_map: errors.append(f'{rel}: noindex but listed in sitemap')
    if not noindex and not in_map and rel not in ('404.html', 'thank-you.html'): warns.append(f'{rel}: indexable but not in sitemap')
for tt, rels in titles.items():
    if len(rels) > 1: errors.append(f'duplicate title "{tt}": {", ".join(rels)}')
for loc in sitemap:
    if not (root/(loc or 'index.html')).exists(): errors.append(f'sitemap lists missing page /{loc}')
print(f'{len(pages)} pages checked: {len(errors)} errors, {len(warns)} warnings')
for e in errors: print('ERROR', e)
for w in warns[:40]: print('warn ', w)
sys.exit(1 if errors else 0)
