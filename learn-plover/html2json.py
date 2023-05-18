#!/usr/bin/env python3
import json
import re
import sys

jdata = {}
for fname in sys.argv[1:]:
    with open(fname, 'r') as f:
        data = f.read()
        if(not fname.endswith('.html')):
            print(f"{fname} is not a html file")
            continue
        start_tag = '<body>'
        start_location = data.find('<body>')
        end_location = data.find('</body>')
        if(-1 == start_location):
            print(f"Failed to find '<body>' in {fname}")
            continue
        if(-1 == end_location):
            print(f"Failed to find '</body>' in {fname}")
            continue
        print(f"Processing {fname} ({len(data)} bytes)")
        content_start = len(start_tag) + start_location
        data = data[content_start:end_location]
        jdata[fname[:-5]] = {"content": data}

l = list(jdata.keys())
ls = sorted(l)
print(ls)
for i, key in enumerate(ls):
    jdata[key]['id'] = i

with open("lessons.json", "w") as outfile:
    json.dump(jdata, outfile)
