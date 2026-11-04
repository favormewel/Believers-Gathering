#!/usr/bin/env python3
"""Turn an open-bibles XML file (OSIS or Zefania) into one JSON file per book.

Usage:  python3 build_bible.py eng-kjv.osis.xml kjv
Output: bible/kjv/GEN.json ... bible/kjv/REV.json   (66 files)
Get the XML files from https://github.com/seven1m/open-bibles (all public domain).
Upload the bible/ folder to your site, then set BIBLE_BASE_URL in config.js.
"""
import sys, os, json, re
import xml.etree.ElementTree as ET

IDS = "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV".split()
OSIS = "Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev".split()
O2I = dict(zip(OSIS, IDS))

def tag(e): return e.tag.split('}')[-1]
def clean(t): return re.sub(r'\s+', ' ', t).strip()

def parse_zefania(root):
    data = {}
    for b in root.iter():
        if tag(b) != 'BIBLEBOOK': continue
        i = int(b.get('bnumber')) - 1
        for c in b:
            if tag(c) != 'CHAPTER': continue
            vs = [[int(v.get('vnumber')), clean(''.join(v.itertext()))] for v in c if tag(v) == 'VERS']
            data.setdefault(IDS[i], {})[str(int(c.get('cnumber')))] = vs
    return data

def parse_osis(root):
    data, state = {}, {'cur': None, 'buf': []}
    def flush():
        cur = state['cur']
        if cur:
            p = cur.split('.')
            bid = O2I.get(p[0])
            text = clean(''.join(state['buf']))
            if bid and len(p) >= 3 and text:
                data.setdefault(bid, {}).setdefault(p[1], []).append([int(p[2]), text])
        state['cur'], state['buf'] = None, []
    def walk(e, in_note=False):
        t = tag(e)
        if t == 'verse':
            sid, eid, oid = e.get('sID'), e.get('eID'), e.get('osisID')
            if sid: flush(); state['cur'] = sid.split()[0]
            elif eid: flush()
            elif oid:
                flush(); state['cur'] = oid.split()[0]
                state['buf'].append(''.join(x for x in textof(e)))
                flush()
                if e.tail and False: pass
                return
        note = in_note or t in ('note', 'title', 'catchWord', 'rdg')
        if not note and e.text and state['cur']: state['buf'].append(e.text)
        for ch in e:
            walk(ch, note)
            if not note and ch.tail and state['cur']: state['buf'].append(ch.tail)
    def textof(e):
        out = [e.text or '']
        for ch in e:
            if tag(ch) not in ('note', 'rdg'): out.extend(textof(ch))
            out.append(ch.tail or '')
        return out
    walk(root); flush()
    for b in data.values():
        for c in b.values(): c.sort(key=lambda v: v[0])
    return data

def main():
    if len(sys.argv) != 3: sys.exit(__doc__)
    path, code = sys.argv[1], sys.argv[2]
    root = ET.parse(path).getroot()
    data = parse_zefania(root) if tag(root).upper() == 'XMLBIBLE' else parse_osis(root)
    folder = os.path.join('bible', code); os.makedirs(folder, exist_ok=True)
    for bid in IDS:
        if bid in data:
            with open(os.path.join(folder, bid + '.json'), 'w', encoding='utf-8') as f:
                json.dump(data[bid], f, ensure_ascii=False, separators=(',', ':'))
    chapters = sum(len(b) for b in data.values()); verses = sum(len(c) for b in data.values() for c in b.values())
    print(f"{len(data)} books, {chapters} chapters, {verses} verses written to {folder}")

if __name__ == '__main__': main()
