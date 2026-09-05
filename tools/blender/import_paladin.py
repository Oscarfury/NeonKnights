"""Import the user-provided source archive without changing the original ZIP."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

parser=argparse.ArgumentParser()
parser.add_argument('archive',type=Path)
args=parser.parse_args()
root=(Path(__file__).resolve().parents[2]/'art/source/vendor/paladin').resolve()
root.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(args.archive) as archive:
    for entry in archive.infolist():
        target=(root/entry.filename).resolve()
        if not target.is_relative_to(root):raise ValueError('Archive entry is outside the source directory')
    archive.extractall(root)
record={'archive':args.archive.name,'sha256':hashlib.sha256(args.archive.read_bytes()).hexdigest(),'artist':'Silver Delivery'}
(root/'import.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf8')
print(json.dumps(record))
