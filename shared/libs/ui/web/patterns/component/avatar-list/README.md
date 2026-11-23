Avatar list — the moods' dashboard "Upcoming renewals": rows of avatar · name over a line · a chip on the right

header — heading2 title (a card's title is the theme's h2, as the moods draw it) and a quiet small button ("View all"), space between
each row is a `ListItem` with the list's own parts: `ListItemIcon` (an `Avatar scale="sm"`), `ListItemContent` (`ListItemTitle` strong name, `ListItemDescription` quiet line), `ListItemAction` (a small `Badge`, with the dot when it carries a status)
the list sits in a `Stack concept="rows"`: the theme makes the items bare rows with a rule between them, as `keyValues` does for key · value rows
