Activity — a card with a vertical timeline of events (the moods' dashboard `.timeline`)

each event is a row: a marker column (22px) and the text
marker — a `size="fixed"` column (`w-6`, stretched to the row, `pt-1` so the dot meets the line) with the status dot (`Badge scale="3xs" concept="dot"`) and, under it, the thread: a vertical `Separator` (`flex-1 self-center`: the component's own `self-stretch` would win over the column's centring)
text — one line with a strong lead (an `as="strong"` Text with no type of its own: it inherits the line's and keeps the browser's bolder), the time under it in the quiet extra-small
the list is a `Stack concept="timeline"`: the theme reaches the dot and the thread through it
the text column is `size="fill"`; the rhythm (18px between events as the list's gap, 14px dot-to-text as the row's gap; a Stack never writes `pad`, the lint's slot rule) is the pattern's, as every Stack gap is. Widths go by Stack `size` and the Tailwind scale, as in the other patterns; no arbitrary pixel classes
