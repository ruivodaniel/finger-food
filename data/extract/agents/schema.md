# Quote extraction — one JSON file per quote

You read ONE quote (free text written by a caterer, Portuguese) and write ONE JSON file with exactly this shape.
Rules: write only what the text says. The ONE exception is the client name and the event dates, which you may take from the file name (given to you) when the text lacks them; say so in client_source / source. If something is not written, use null (or []). Never infer, never calculate, never invent.
Keep item texts as written (do not translate, do not fix spelling). Numbers are plain numbers (18.5, not "18,5€").

```json
{
  "quote_id": "<id given to you>",
  "client": "<client name from the text, or from the file name when the text does not give one, or null>",
  "client_source": "text | file_name | null",
  "event_dates": [{"day": 17, "month": 6, "year": 2026, "source": "text | file_name"}],   // every date of the event(s); day/month/year null when not written; take it from the file name only if the text has none
  "place": "<venue / city as written or null>",
  "moments": [                                                    // one per service in the quote: a coffee break, a lunch, a dinner, a cocktail...
    {
      "name_as_written": "Coffee break am",
      "service_type": "coffee_break | lunch | dinner | cocktail | brunch | delivery | other",
      "guests": 50,                                              // people to feed at THIS moment, null if not written
      "guests_raw": "50-70",                                     // exactly as written, or null
      "menu_lines": [
        {"segment": "savory_miniatures | sweet_miniatures | starter | main_dish | dessert | drink | decoration | other",
         "items": [{"text": "Bolinhos de Bacalhau", "quantity": 30}]}   // quantity only when written next to the item, else null
      ],
      "prices": [{"label": "Comidas", "unit_price": 18, "quantity": 60, "line_total": 1080, "vat_rate": 13}]   // price lines of this moment; vat_rate only when written
    }
  ],
  "prices_not_in_a_moment": [ same shape as prices ],             // price lines that cannot be tied to one moment
  "total": 1522.74,                                               // the final total as written, or null
  "total_includes_vat": true,                                     // true / false / null when the text does not say
  "staff_mentioned": "dois funcionários",                         // exactly as written or null
  "notes": ["short free-text things worth keeping, as written"],
  "uncertain": ["anything you were not sure about, in one short sentence each"]
}
```
If the quote has no clear moments, make ONE moment holding everything.
Menu lines: "Miniaturas salgadas" -> savory_miniatures, "Miniaturas doces" -> sweet_miniatures, "Entradas" -> starter,
"Prato principal" -> main_dish, "Sobremesa" -> dessert, "Bebidas / Mesa de bebidas" -> drink, "Decoração" -> decoration. Otherwise other.
