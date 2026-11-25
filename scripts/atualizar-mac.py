"""Execute com Python 3 e internet antes de publicar o site."""
import csv, io, json, urllib.request
from pathlib import Path
sources=['https://standards-oui.ieee.org/oui/oui.csv','https://standards-oui.ieee.org/oui28/mam.csv','https://standards-oui.ieee.org/oui36/oui36.csv']
registry={}
for url in sources:
    with urllib.request.urlopen(url,timeout=60) as response:
        rows=csv.DictReader(io.StringIO(response.read().decode('utf-8-sig')))
        for row in rows:
            prefix=row['Assignment'].strip().upper(); name=row['Organization Name'].strip()
            if len(prefix) in (6,7,9) and name: registry[prefix]=[name,'']
if len(registry)<10000: raise RuntimeError('Base incompleta; arquivo anterior preservado.')
path=Path(__file__).resolve().parents[1]/'assets'/'mac-registry.json'
path.write_text(json.dumps(registry,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(f'{len(registry)} prefixos salvos em {path}')
