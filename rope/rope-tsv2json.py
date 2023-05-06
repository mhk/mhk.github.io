#!/usr/bin/env python3
import codecs
import json

def writeJson(path : str, collection : dict):
    with open(f"{path}", "w") as outfile:
        json.dump(collection, outfile)

    with open(f"pretty-{path}", "w") as outfile:
        json.dump(collection, outfile, indent=2)

def main():
    file_name = 'ROPE_3.0.tsv'
    with codecs.open(file_name, 'r', encoding='utf-8', errors='ignore') as f:
    # with open(file_name, 'r') as f:
        collection : dict = {}
        cards : dict = {}
        tags : set = set()
        tags_order0 : list = []
        tags_order1 : list = []
        i : int = 0
        cells : list = []
        words : list = []
        lines = list(f.readlines())
        description = lines[0].strip().split('\t')
        header = lines[1].strip().split('\t')
        collection['name'] = "ROPE 3.0"
        collection['description'] = {}
        if len(description) != len(header):
            print(f'description ({len(description)}) and header ({len(header)}) are not equally long')
            return
        for idx in range(len(description)):
            h = header[idx]
            d = description[idx]
            collection['description'][h] = d
            print(f"{h} => {d}")
        for line in lines[2:]: # ignore header and description
            cells = line.strip().split('\t')
            if(len(cells) != len(header)):
                print(f'cells ({len(cells)}) and header ({len(header)}) are not equally long')
                return
            word = cells[1]
            words.append(word)
            cards[word] = {}
            for idx in range(len(header)):
                head = header[idx]
                cell = cells[idx]
                if 'tags' == head:
                    # cards[word][head] = [cell]
                    cards[word][head] = []
                    if(i < 500):
                        low = (i // 100) * 100 + 1
                        high = (1 + i // 100) * 100
                        t = f"{low}-{high}"
                        cards[word][head].append(t)
                        if t not in tags:
                            tags_order0.append(t)
                    if(i < 3000):
                        low = (i // 1000) * 1000 + 1
                        high = (1 + i // 1000) * 1000
                    else:
                        low = 3001
                        high = 4200
                    t = f"{low}-{high}"
                    if t not in tags:
                        tags_order1.append(t)
                    cards[word][head].append(t)
                    tags.update(cards[word][head])
                elif head in ['rank']:
                    if len(cell) == 0:
                        cards[word][head] = 1
                    else:
                        cards[word][head] = float(cell)
                elif head in ['number', '#rope_keys', '#keys', '#rope_strokes', '#strokes', '#chars', 'ngsl_rank']:
                    if len(cell) == 0:
                        cards[word][head] = 1
                    else:
                        cards[word][head] = int(float(cell))
                elif len(cell) == 0:
                    continue
                else:
                    cards[word][head] = cell
            print(f"{i:04d} {word}")
            i += 1
        collection['cards'] = cards
        collection['order'] = [words]
        collection['tags'] = tags_order0 + tags_order1

    writeJson("cards-ROPE_3.0.json", collection)

    with open("../pretty-cards-plover.json", "r") as infile:
        plover_cards = json.load(infile)

    for card in plover_cards['cards'].values():
        word = card['word']
        if word not in cards:
            print(f'{word} (added)')
            cards[word] = card
            continue
        print(f'{word}')
        cards[word]['tags'] += card['tags']

    collection['name'] = 'all'
    collection['version'] = [0, 5, 0]
    collection['cards'] = cards
    collection['order'].append(plover_cards['order'])
    collection['tags'] = plover_cards['tags'] + collection['tags']

    writeJson("cards-all.json", collection)


if __name__ == "__main__":
    main()
