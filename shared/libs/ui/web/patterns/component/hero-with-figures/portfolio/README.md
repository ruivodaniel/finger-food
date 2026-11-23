Hero with figures — the moods' dashboard `.hero-lg`: a hero card, text on the left, a column of figures on the right

the card is `Card emphasis="hero"` inside a `Stack concept="hero"` (a concept reaches descendants only)
text — `Label` kicker · heading1 title · body · a row of two buttons (primary, secondary)
figures — a `Stack concept="stats"` of `Tile`s, each a row: body-small quiet label · heading2 value (the mood's 22px display figure; numbers-large is the KPI's 30); the theme draws the rule between them and the rule on the left
the two columns are the pattern's: the text is `size="fill"`, the figures `size="fixed"` at `w-2/5` (the mood's 1.4fr · 1fr); the gap (48), the text's rhythm (14) and the space above the buttons (`pt-2`; a Stack never writes `pad`) too
