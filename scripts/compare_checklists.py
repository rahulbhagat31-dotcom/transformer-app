import re
from pathlib import Path

files = [Path('public/js/features/ui.js'), Path('public/js/features/checklist-ui.js')]

for f in files:
    text = f.read_text(encoding='utf-8')
    m = re.search(r'function getStageData\(\) \{\s*return \{(.*)\n\}\s*;\s*\}', text, re.S)
    if not m:
        print('NO GETSTAGEDATA FOUND', f)
        continue
    body = m.group(1)
    stages = [match.group(1) for match in re.finditer(r'([a-zA-Z0-9_]+)\s*:\s*\{', body)]
    print('FILE', f)
    print('STAGES', stages)
    stage_chunks = re.split(r'([a-zA-Z0-9_]+)\s*:\s*\{', body)[1:]
    for i in range(0, len(stage_chunks), 2):
        stage = stage_chunks[i]
        chunk = stage_chunks[i+1]
        section_names = re.findall(r"name:\s*'([^']+)'", chunk)
        print(' ', stage, 'sections', len(section_names))
        for name in section_names[:10]:
            print('    ', name)
        if len(section_names) > 10:
            print('    ...')
    print('---')
