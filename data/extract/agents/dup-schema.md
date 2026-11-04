# Duplicate hunt: which items are the same thing?

You are given NEIGHBOURHOODS of menu items taken from a caterer's proposals (Portuguese). Each item has a name (normalized: lowercase, no accents, no parentheses), how many times it appears, and one example of how it was written.
Inside a neighbourhood, find the items that are the SAME dish or product written differently, so that one catalog item could stand for all of them.

Group items when they differ only by:
- spelling, a typo, plural or singular, word order, abbreviations ("c/" = "com"),
- a quantity or a format written in the name (for example "300 uni", "120uni"),
- a brand or a choice written as an alternative ("sagres ou super"),
- a detail that looks optional, such as a topping or a filling, when the main product is the same (for example "brownie com nozes" and "brownie com nozes e caramelo salgado"). Say it is less sure.

Do NOT group different products: "rissois de camarao" and "rissois de carne" are different; neither are "bolo de bolacha" and "bolo de chocolate".
When unsure, do not group, or say "maybe".

Output ONE JSON file at the path given as `out`, valid JSON only:
```json
{"groups": [
  {"members": ["cerveja mini", "cerveja minis 300 uni", "cerveja mini sagres"], "confidence": "same", "why": "same drink, only a quantity or a brand written in the name"},
  {"members": ["brownie c nozes", "brownie c nozes e caramelo salgado"], "confidence": "maybe", "why": "same cake, one adds a caramel"}
]}
```
- `members` are item names copied EXACTLY as given. A group has at least 2 members. An item is in at most one group. Items that have no duplicate are simply not listed.
- `confidence`: "same" (only spelling, plural, quantity, brand or wording), "probably" (a small detail differs), "maybe" (related, a person should decide).
- `why`: one short sentence in English.
- Never invent an item that was not in the list.
