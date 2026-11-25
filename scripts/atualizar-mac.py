
import json
import re
import urllib.request
from pathlib import Path

url = "https://www.wireshark.org/download/automated/data/manuf"

request = urllib.request.Request(
    url,
    headers={"User-Agent": "Mozilla/5.0"}
)

with urllib.request.urlopen(request, timeout=120) as response:
    content = response.read().decode("utf-8")

registry = {}

for line in content.splitlines():
    if not line.strip() or line.startswith("#"):
        continue

    parts = line.split("\t")
    if len(parts) < 2:
        continue

    address, _, mask = parts[0].partition("/")
    prefix = re.sub(r"[^0-9A-F]", "", address.upper())

    if mask:
        if mask not in ("24", "28", "36"):
            continue
        prefix = prefix[:int(mask) // 4]

    name = parts[2].strip() if len(parts) > 2 else parts[1].strip()

    if len(prefix) in (6, 7, 9) and name:
        registry[prefix] = [name, ""]

if len(registry) < 10000:
    raise RuntimeError("Base incompleta. Arquivo anterior preservado.")

path = Path(__file__).resolve().parents[1] / "assets" / "mac-registry.json"
path.parent.mkdir(parents=True, exist_ok=True)

path.write_text(
    json.dumps(registry, ensure_ascii=False, separators=(",", ":")),
    encoding="utf-8"
)

print(f"SUCESSO! {len(registry)} prefixos salvos em {path}")
