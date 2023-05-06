#!/usr/bin/env python3
import codecs
import json

def main():
    collection : dict = {}
    collection['name'] = "Plover"
    collection['description'] = {}
    cards : dict = {}
    order : list = []
    tags : set = set()
    tags_order : list = []
    with open("exercises.json", "r") as infile:
        exercises = json.load(infile)
    plover = exercises[0]
    for chap in plover['chapters']:
        name = chap['name']
        additional_tags = chap.get('additional_tags', {})
        additional_tag = []
        print(f"{name} ({additional_tags})")
        for word in chap['data']:
            card = cards.get(word, {'word': word, 'tags': [], "#chars": len(word)})
            if word in additional_tags:
                additional_tag = additional_tags[word]
            card['tags'] += chap.get('tags', []) + [name] + additional_tag
            for tag in card['tags']:
                if tag not in tags:
                    tags_order.append(tag)
            tags.update(card['tags'])
            cards[word] = card
            order.append(word)

    collection['cards'] = cards
    collection['order'] = order
    collection['tags'] = tags_order

    with open("cards-plover.json", "w") as outfile:
        json.dump(collection, outfile)

    with open("pretty-cards-plover.json", "w") as outfile:
        json.dump(collection, outfile, indent=2)

if __name__ == "__main__":
    main()
