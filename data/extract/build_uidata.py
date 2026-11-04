"""Builds the UI-as-data pages of the data exploration in slice-design's FINGER-FOOD project: documents, snapshots (the sample rows as `served`) and designs.
Run: python3 build_uidata.py   (needs data/sample/sample.json from fixtures_sample.py)"""
import json, os, uuid, datetime
PROJ = os.environ.get("FF_PROJECT", "/Users/danieldedecastroruivo/DEV/OmniChord-26/slice-design/projects/FINGER-FOOD")
S = json.load(open(os.path.join(os.path.dirname(__file__), "..", "sample", "sample.json")))
now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")
NS = uuid.UUID("6f1d5a52-0c0e-4f0a-9d1e-3b7a2c4e8f10")
uid = lambda key: str(uuid.uuid5(NS, key))   # stable ids: a rebuild keeps the page addresses
eur = lambda x: "?" if x is None else (f"{x:,.2f}".replace(",", " ").replace(".", ",") + " €")
MON = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
def dshort(q):
    ds = [x for x in q["event_dates"] if x.get("day") or x.get("month")]
    if not ds: return "no date"
    mo = next((x["month"] for x in ds if x.get("month")), None); days = [str(x["day"]) for x in ds if x.get("day")]
    return (", ".join(days[:3]) + (" …" if len(days) > 3 else "") + " " if days else "") + (MON[mo - 1] if mo else "?")
def dstr(q):
    ds = [x for x in q["event_dates"] if x.get("day") or x.get("month")]
    return ("; ".join(f"{x.get('day') or '?'}/{x.get('month') or '?'}" + (f"/{x['year']}" if x.get("year") else "") for x in ds[:3]) + (" …" if len(ds) > 3 else "")) if ds else "no date"
# ---------------- documents: product pages, in the shell, the way the PROWD organizations page is built
def T(text, element=None, emphasis=None):
    props = {"text": text}
    if element: props["element"] = element
    if emphasis: props["emphasis"] = emphasis
    return {"type": "Text", "props": props}
B = lambda p: {"bind": p}
def stack(children, dir="col", gap=8, **props):
    return {"type": "Stack", "props": {"dir": dir, "gap": gap, **props}, "children": children}
def badge(text, status=None, emphasis=None, **extra):
    props = {"text": text, "scale": "xs"}
    if status: props["status"] = status
    if emphasis: props["emphasis"] = emphasis
    return {"type": "Badge", "props": props, **extra}
def rep(node, each, as_): node["repeat"] = {"each": each, "as": as_}; return node
def card(inner, **extra): return {"type": "Card", **extra, "children": [{"type": "CardContent", "children": [inner]}]}
def use(name, args=None, on=None, **extra):
    n = {"use": {"component": name, "version": "latest"}, **extra}
    if args: n["args"] = args
    if on: n["on"] = on
    return n
def shell(title, icon, body):
    return use("SidebarShell", slots={"children": [use("TitleBandLayout", {"title": title, "icon": icon}, slots={"children": [body]})]})
def page(name, title, icon, body, state=None):
    return {"kind": "page", "schemaVersion": 1, "name": name, "version": 1, "data": {"session": {"source": "session"}, "entities": {"source": "uiEntities"}}, "state": state or {}, "calc": {"activeOrgId": {"bind": "data.session.session.activeOrganizationId"}}, "root": shell(title, icon, body)}
def component(name, params, emits, root): return {"kind": "component", "schemaVersion": 1, "name": name, "version": 1, "params": params, "emits": emits, "root": root}
V = "data.entities.served."
def tile(path, as_="s"):   # one count: it grows to share the row with the others
    return {"type": "Stack", "props": {"size": "fill", "dir": "col"}, "repeat": {"each": path, "as": as_}, "children": [card(stack([T(B("s.label"), "type--body-small", "quiet"), T(B("s.value"), "type--heading3"), T(B("s.hint"), "type--body-small", "quiet")], gap=4))]}
def stats_row(path):   # the counts on top
    return stack([tile(V + path)], dir="row", gap=16)
def filter_component(name, prefix, tabs, placeholder, select_label=None, select_param=None):
    tabs_node = {"type": "Tabs", "props": {"value": B("status")}, "children": [{"type": "TabsList", "children": [{"type": "TabsTrigger", "props": {"value": v, "testid": f"{prefix}-filter-{v}-tab", "text": t}} for v, t in tabs]}], "on": {"change": [{"emit": {"event": "status", "payload": {"value": B("event.value")}}}]}}
    search = {"type": "Input", "props": {"testid": f"{prefix}-filter-search-input", "type": "search", "value": B("search"), "placeholder": placeholder, "position": "w-md"}, "on": {"change": [{"emit": {"event": "search", "payload": {"value": B("event.value")}}}]}}
    kids, params, emits = [tabs_node, search], ["search", "status"], ["search", "status"]
    if select_param:
        kids.append({"type": "Stack", "props": {"dir": "col", "size": "fixed"}, "children": [{"type": "InputSelect", "props": {"testid": f"{prefix}-filter-{select_param}-select", "ariaLabel": select_label, "placeholder": select_label, "clearable": False,
            "value": {"if": [{"exists": B(select_param)}, B(select_param), "all"]}, "options": {"prepend": [{"obj": {"value": "all", "label": "All " + select_label.lower()}}, {"map": [B(select_param + "s"), {"obj": {"value": B("item.id"), "label": B("item.label")}}]}]}, "position": "w-sm"},
            "on": {"change": [{"emit": {"event": select_param, "payload": {"value": B("event.value")}}}]}}]})
        params += [select_param, select_param + "s"]; emits.append(select_param)
    return component(name, params, emits, stack(kids, dir="row", gap=12, align="center", wrap=True, testid=f"{prefix}-filter"))
def table_component(name, prefix, heads, cells, emit_first_col=True):
    return component(name, ["rows"], ["enter"], {"type": "Fragment", "children": [
        {"type": "EmptyState", "props": {"emphasis": "quiet", "title": "Nothing here", "description": "No rows match."}, "when": {"eq": [{"count": B("rows")}, 0]}},
        {"type": "Table", "when": {"gt": [{"count": B("rows")}, 0]}, "children": [{"type": "TableHeader", "children": [{"type": "TableRow", "children": [{"type": "TableHead", "props": {"text": h}} for h in heads]}]},
          {"type": "TableBody", "children": [{"type": "TableRow", "repeat": {"each": "rows", "as": "r"}, "children": [{"type": "TableCell", "children": [c]} for c in cells]}]}]}]})
def list_body(prefix, filter_name, table_name, state_keys, filter_args, total_path):
    extra = {state_keys: [{"set": {"state": state_keys, "to": B("event.value")}}, {"set": {"state": "page", "to": 1}}]} if state_keys else {}
    return stack([stats_row("stats"), card(stack([
        use(filter_name, filter_args, {"search": [{"set": {"state": "search", "to": B("event.value")}}, {"set": {"state": "page", "to": 1}}], "status": [{"set": {"state": "status", "to": B("event.value")}}, {"set": {"state": "page", "to": 1}}], **extra}),
        use(table_name, {"rows": B(V + "rows")}),
        {"type": "ListPagination", "props": {"page": B("state.page"), "pageSize": 10, "total": {"if": [{"exists": B(V + "total")}, B(V + "total"), 0]}, "testid": f"{prefix}-pagination"}, "on": {"change": [{"set": {"state": "page", "to": B("event.value")}}]}}], gap=16))], gap=24, size="fill", testid=f"{prefix}-page")
# ---- Proposals (the ERD's words: proposal, moment, menu line, item)
SERVICES = [("coffee_break", "Coffee break"), ("lunch", "Lunch"), ("dinner", "Dinner")]
STATES = [("draft", "Draft"), ("sent", "Sent"), ("accepted", "Accepted"), ("rejected", "Rejected")]   # proposal_state of the canonical ERD
prop_filter = filter_component("ProposalsFilter", "proposals", [("all", "All")] + STATES, "Search by client", "Services", "service")
none_text = lambda path, empty: {"if": [{"exists": B(path)}, {"concat": [B(path)]}, empty]}
prop_table = table_component("ProposalsTable", "proposals", ["Client", "Date", "Status", "Moments", "Most guests", "Menu items"], [
    stack([T(B("r.client"), "type--body"), T(B("r.file"), "type--body-extra-small", "quiet")], gap=2), T(B("r.date")), badge(B("r.state_text"), status=B("r.state_status")),
    stack([{**badge(B("sv.text"), emphasis="secondary"), "repeat": {"each": "r.services", "as": "sv"}}], dir="row", gap=6, wrap=True),
    {"type": "Text", "props": {"text": none_text("r.guests", "not written")}}, T(B("r.items"))])
prop_page = page("ProposalsPage", "Proposals", "fileText", list_body("proposals", "ProposalsFilter", "ProposalsTable", "service", {"search": B("state.search"), "status": B("state.status"), "service": B("state.service"), "services": {"if": [{"exists": B(V + "services")}, B(V + "services"), []]}}, "total"), {"search": "", "service": "", "status": "all", "page": 1})
# ---- Proposal (view): the header, then the moments as expandable rows
Q = V + "proposal."
def acc(children, type="multiple", default=None, **p):
    props = {"type": type, **p}
    if default is not None: props["defaultValue"] = default
    return {"type": "Accordion", "props": props, "children": children}
def acc_item(value, trigger, content, **extra): return {"type": "AccordionItem", "props": {"value": value}, **extra, "children": [{"type": "AccordionTrigger", "children": [trigger]}, {"type": "AccordionContent", "children": [content]}]}
def menu_columns(prefix):   # the menu of a moment: one column, a small group label, then its items one per line
    return stack([rep(stack([T(B("l.segment"), "type--body-small", "quiet"), stack([rep(T(B("it.text"), "type--body"), "l.items", "it")], gap=2)], gap=4), "m.menu_lines", "l")], dir="col", gap=14)
def moment_row(content):
    trig = stack([T(B("m.day"), "type--body-small", "quiet"), T(B("m.title"), "type--body"), badge(B("m.service")), badge(B("m.guests_text"), emphasis="secondary"), {"type": "Stack", "props": {"dir": "row", "size": "fill"}, "children": []}, T(B("m.items_text"), "type--body-small", "quiet")], dir="row", gap=12, align="center", wrap=True)
    return rep(acc_item(B("m.id"), trig, content), Q + "moments", "m")
prop_body = stack([
    card(stack([stack([T(B(Q + "client"), "type--heading3"), badge(B(Q + "state_text"), status=B(Q + "state_status")), {"type": "Stack", "props": {"dir": "row", "size": "fill"}, "children": []}, T(B(Q + "dates_text"), "type--body")], dir="row", gap=10, align="center", wrap=True),
      T(B(Q + "file_line"), "type--body-small", "quiet")], gap=6)),
    stack([tile(Q + "stats")], dir="row", gap=16),
    stack([T("Moments", "type--heading4"), acc([moment_row(menu_columns("m"))], default=B(Q + "open_ids"))], gap=12)], gap=24, size="fill", testid="proposal-detail-page")
prop_detail = page("ProposalPage", "Proposal", "fileText", prop_body)
# ---- New proposal: three sections that fold into one summary line each (client, event, moments)
N = V
def field(label, path, placeholder=""):
    return stack([{"type": "Label", "props": {"text": label}}, {"type": "Input", "props": {"value": {"if": [{"exists": B(path)}, B(path), ""]}, "placeholder": placeholder, "position": "w-sm"}}], gap=4)
def section_trigger(title, summary_path):
    return stack([T(title, "type--heading4"), {"type": "Stack", "props": {"dir": "row", "size": "fill"}, "children": []}, T(B(summary_path), "type--body", "quiet")], dir="row", gap=12, align="center")
client_content = stack([
    {"type": "Input", "props": {"type": "search", "value": B("state.client"), "placeholder": "Who is it for? Type a name", "position": "w-lg", "testid": "new-proposal-client-input"}, "on": {"change": [{"set": {"state": "client", "to": B("event.value")}}]}},
    stack([rep({"type": "Button", "props": {"buttonType": "icon-text", "startIcon": "user", "emphasis": "tertiary", "label": B("c.label")}}, N + "client_matches", "c")], gap=4),
    {"type": "Button", "props": {"buttonType": "icon-text", "startIcon": "add", "emphasis": "secondary", "label": {"concat": ["Create \u201c", B("state.client"), "\u201d"]}, "testid": "new-proposal-create-client-btn"}, "when": B(N + "can_create")}], gap=12)
event_content = stack([stack([field("Starts", N + "event.starts", "Day and time"), field("Ends", N + "event.ends", "Day and time"), field("Guests", N + "event.guests", "How many"), field("Place", N + "event.place", "Optional")], dir="row", gap=16, wrap=True),
    {"type": "Button", "props": {"buttonType": "icon-text", "startIcon": "add", "emphasis": "tertiary", "label": "Add a day"}}], gap=16)
def moment_edit():
    trig = stack([T(B("m.day"), "type--body-small", "quiet"), T(B("m.title"), "type--body"), badge(B("m.service")), badge(B("m.guests_text"), emphasis="secondary"), {"type": "Stack", "props": {"dir": "row", "size": "fill"}, "children": []}, T(B("m.items_text"), "type--body-small", "quiet")], dir="row", gap=12, align="center", wrap=True)
    body = stack([stack([field("Guests", "m.guests_value", B(N + "event.guests_hint")), field("Starts", "m.starts", "Day and time"), field("Ends", "m.ends", "Day and time")], dir="row", gap=16, wrap=True), menu_columns("m"),
        {"type": "Button", "props": {"buttonType": "icon-text", "startIcon": "add", "emphasis": "tertiary", "label": "Add an item"}}], gap=16)
    return rep(acc_item(B("m.id"), trig, body), N + "moments", "m")
moments_content = stack([acc([moment_edit()], default=B(N + "open_moments")), stack([{"type": "Button", "props": {"buttonType": "icon-text", "startIcon": "add", "emphasis": "secondary", "label": "From a template"}}, {"type": "Button", "props": {"buttonType": "icon-text", "startIcon": "add", "emphasis": "tertiary", "label": "Start empty"}}], dir="row", gap=8)], gap=16)
new_body = stack([acc([acc_item("client", section_trigger("1  Client", N + "client_summary"), client_content), acc_item("event", section_trigger("2  Event", N + "event_summary"), event_content), acc_item("moments", section_trigger("3  Moments", N + "moments_summary"), moments_content)], default=B(N + "open_sections")),
    card(stack([T(B(N + "send_text"), "type--body", "quiet"), {"type": "Stack", "props": {"dir": "row", "size": "fill"}, "children": []}, {"type": "Button", "props": {"label": "Send proposal", "emphasis": "primary", "disabled": B(N + "cannot_send"), "testid": "new-proposal-send-btn"}}], dir="row", gap=12, align="center"))], gap=24, size="fill", testid="new-proposal-page")
new_page = page("ProposalNewPage", "New proposal", "add", new_body, {"client": ""})
# ---- Invoices
inv_filter = filter_component("InvoicesFilter", "invoices", [("all", "All"), ("received", "Received"), ("open", "Not in the list")], "Search by customer", "Years", "year")
inv_table = table_component("InvoicesTable", "invoices", ["Invoice", "Customer", "Issued", "Net", "Total", "Payment"], [
    T(B("r.number"), "type--body"), stack([T(B("r.customer"), "type--body"), T(B("r.tax_id"), "type--body-extra-small", "quiet")], gap=2), T(B("r.issued")), T(B("r.net_text")), T(B("r.total_text")), badge(B("r.payment_text"), status=B("r.payment_status"))])
inv_page = page("InvoicesPage", "Invoices", "briefcase", list_body("invoices", "InvoicesFilter", "InvoicesTable", "year", {"search": B("state.search"), "status": B("state.status"), "year": B("state.year"), "years": {"if": [{"exists": B(V + "years")}, B(V + "years"), []]}}, "total"), {"search": "", "year": "", "status": "all", "page": 1})
# ---- Quote detail
Q = V + "quote."
moment = card(stack([
    stack([T(B("m.title"), "type--heading4"), badge(B("m.service")), badge(B("m.guests_text"), emphasis="secondary"), {"type": "Stack", "props": {"dir": "row", "size": "fill"}, "children": []}, T(B("m.subtotal_text"), "type--heading4")], dir="row", gap=8, align="center", wrap=True),
    stack([rep(stack([T(B("l.segment"), "type--body-small", "quiet"), stack([rep(badge(B("it.text"), emphasis="secondary"), "l.items", "it")], dir="row", gap=6, wrap=True)], gap=4), "m.menu_lines", "l")], gap=12),
    {"type": "Table", "when": B("m.has_prices"), "children": [{"type": "TableHeader", "children": [{"type": "TableRow", "children": [{"type": "TableHead", "props": {"text": h}} for h in ("Price line", "Unit", "Qty", "Total", "VAT")]}]},
      {"type": "TableBody", "children": [{"type": "TableRow", "repeat": {"each": "m.prices", "as": "p"}, "children": [{"type": "TableCell", "children": [T(B("p." + k))]} for k in ("label", "unit_text", "qty_text", "total_text", "vat_text")]}]}]}], gap=14))
rep(moment, Q + "moments", "m")
quote_body = stack([
    card(stack([stack([T(B(Q + "client"), "type--heading3"), badge(B(Q + "client_note"), emphasis="secondary", when=B(Q + "client_note")), badge(B(Q + "vat_text"), emphasis="secondary", when=B(Q + "vat_text")), {"type": "Stack", "props": {"dir": "row", "size": "fill"}, "children": []}, T(B(Q + "total_text"), "type--heading3")], dir="row", gap=10, align="center", wrap=True),
      T(B(Q + "file_line"), "type--body-small", "quiet")], gap=6)),
    stack([tile(Q + "stats")], dir="row", gap=16),
    stack([T("Moments", "type--heading4"), moment], gap=12),
    card(stack([rep(T(B("o"), "type--body-small"), Q + "outside", "o")], gap=6), when=B(Q + "has_outside")),
    {"type": "Alert", "props": {"status": "warning"}, "when": B(Q + "has_uncertain"), "children": [stack([T("To check", "type--heading4"), rep({"type": "AlertDescription", "props": {"text": B("u")}}, Q + "uncertain_list", "u")], gap=6)]}], gap=24, size="fill", testid="quote-detail-page")
quote_page = page("QuoteDetailPage", "Quote", "fileText", quote_body)
# ---- Invoice detail
I = V + "invoice."
inv_body = stack([
    card(stack([stack([T(B(I + "number"), "type--heading3"), badge(B(I + "payment_status_text"), status=B(I + "payment_badge")), {"type": "Stack", "props": {"dir": "row", "size": "fill"}, "children": []}, T(B(I + "gross_text"), "type--heading3")], dir="row", gap=10, align="center", wrap=True),
      T(B(I + "customer"), "type--heading4"), T(B(I + "meta_line"), "type--body-small", "quiet"), T(B(I + "terms_line"), "type--body-small", "quiet")], gap=6)),
    stack([tile(I + "stats")], dir="row", gap=16),
    card(stack([T("Lines", "type--heading4"), {"type": "Table", "children": [{"type": "TableHeader", "children": [{"type": "TableRow", "children": [{"type": "TableHead", "props": {"text": h}} for h in ("Line", "Qty", "Unit", "VAT", "Total")]}]},
      {"type": "TableBody", "children": [{"type": "TableRow", "repeat": {"each": I + "lines", "as": "l"}, "children": [{"type": "TableCell", "children": [T(B("l." + k))]} for k in ("description", "qty_text", "unit_text", "vat_text", "total_text")]}]}]}], gap=12)),
    card(stack([T("Payment", "type--heading4"), T(B(I + "payment_text"), "type--body-small")], gap=6)),
    card(stack([T("Other invoices of this customer in the sample", "type--heading4"), rep(T(B("o"), "type--body-small"), I + "others", "o")], gap=6), when=B(I + "has_others"))], gap=24, size="fill", testid="invoice-detail-page")
inv_detail = page("InvoiceDetailPage", "Invoice", "briefcase", inv_body)
# ---------------- view models for the new pages
def stat(label, value, hint=""): return dict(label=label, value=str(value), hint=hint)
qs = S["proposals"]; ivs = S["invoices"]
SAMPLE_STATES = ["accepted", "sent", "accepted", "sent", "draft", "accepted", "rejected", "sent", "accepted", "sent"]   # the history has no status: these are sample states, for designing the page
STATE_STATUS = {"draft": "neutral", "sent": "info", "accepted": "success", "rejected": "error"}
def prop_row(q, state):
    g = [m["guests"] for m in q["moments"] if m["guests"] is not None]
    return dict(client=q["client"] or "No client", file=q["file_name"], date=dshort(q), services=[dict(text=t.replace("_", " ")) for t in dict.fromkeys(m["service_type"] for m in q["moments"])], guests=(max(g) if g else None), items=q["items"], state_text=state, state_status=STATE_STATUS[state])
served_proposals = {"total": len(qs), "stats": [stat("Proposals", len(qs), "in the sample"), stat("Sent", SAMPLE_STATES[:len(qs)].count("sent"), "waiting for an answer"), stat("Accepted", SAMPLE_STATES[:len(qs)].count("accepted"), "became an event"), stat("Rejected", SAMPLE_STATES[:len(qs)].count("rejected"), "turned down")],
  "services": [dict(id=sv, label=sv.replace("_", " ")) for sv in ("coffee_break", "lunch", "dinner")], "rows": [prop_row(q, SAMPLE_STATES[i]) for i, q in enumerate(qs)]}
def pvm(q, state):
    gmax = max([m["guests"] or 0 for m in q["moments"]] or [0])
    days = [d for d in q["event_dates"] if d.get("day") or d.get("month")]
    dates_text = (", ".join(str(d["day"]) for d in days if d.get("day")) + (" " + MON[days[0]["month"] - 1] if days and days[0].get("month") else "")) if days else "dates not written"
    ms = []
    for i, m in enumerate(q["moments"]):
        n = sum(len(l["items"]) for l in m["menu_lines"])
        dd = next((d for d in days if d.get("day")), None)
        ms.append(dict(id=f"m{i}", day=(f"{dd['day']} {MON[dd['month'] - 1]}" if dd and dd.get("month") else (str(dd["day"]) if dd else "")), title=m["name_as_written"] or m["service_type"].replace("_", " "), service=m["service_type"].replace("_", " "),
          guests_text=(f"{m['guests']} guests" if m["guests"] is not None else "guests not written"), items_text=f"{n} items",
          menu_lines=[dict(segment=l["segment"].replace("_", " "), items=[dict(text=(f"{x['text']} ({x['quantity']})" if x.get("quantity") else x["text"])) for x in l["items"]]) for l in m["menu_lines"]]))
    return dict(client=q["client"] or "No client", state_text=state, state_status=STATE_STATUS[state], dates_text=dates_text, file_line="Source: " + q["file_name"],
      stats=[stat("Guests", gmax if gmax else "not written", "most at one moment"), stat("Moments", len(q["moments"])), stat("Menu items", q["items"])], open_ids=[ms[0]["id"]] if ms else [], moments=ms)
bigq = max([x for x in qs if len(x["moments"]) >= 2], key=lambda x: x["items"])
served_proposal = {"proposal": pvm(bigq, "sent")}
def inv_row(i):
    return dict(number=i["number"], customer=i["customer"], tax_id=("Tax id " + i["tax_id"]) if i["tax_id"] else "", issued=i["issue_date"], net_text=eur(i["net"]), total_text=eur(i["gross"]), payment_text="received" if i["payment"] else "not in the list", payment_status="success" if i["payment"] else "warning")
served_invoices = {"total": len(ivs), "stats": [stat("Invoices", len(ivs), "in the sample"), stat("Net", eur(sum(i["net"] for i in ivs)), "before VAT"), stat("Received", sum(1 for i in ivs if i["payment"]), "found in Gonçalo's list"), stat("Not in the list", sum(1 for i in ivs if not i["payment"]), "no payment date")],
  "years": [dict(id=y, label=y) for y in sorted({i["issue_date"][:4] for i in ivs})], "rows": [inv_row(i) for i in ivs]}
inv = next((i for i in ivs if i["payment"] and len(i["lines"]) >= 2), next(i for i in ivs if i["payment"]))
others = [f"{o['number']} · {o['issue_date']} · {eur(o['gross'])}" for o in ivs if o["customer"] == inv["customer"] and o["number"] != inv["number"]]
days = (datetime.date.fromisoformat(inv["payment"]["received_date"]) - datetime.date.fromisoformat(inv["issue_date"])).days if inv["payment"] else None
served_invoice = {"invoice": dict(number=inv["number"], gross_text=eur(inv["gross"]), customer=inv["customer"], meta_line=f"Tax id {inv['tax_id'] or 'none'} · issued {inv['issue_date']}" + (f" · due {inv['due_date']}" if inv["due_date"] else ""), terms_line=f"Terms: {inv['payment_terms'] or 'not written'} · {inv['source']}",
  payment_status_text="received" if inv["payment"] else "not in the list", payment_badge="success" if inv["payment"] else "warning", stats=[stat("Net", eur(inv["net"])), stat("VAT", eur(inv["vat"])), stat("Lines", len(inv["lines"])), stat("Days to payment", days if days is not None else "?", "issue to received")],
  lines=[dict(description=l["description"], qty_text=str(l["quantity"]), unit_text=eur(l["unit_price"]), vat_text=f"{l['vat_rate']}%", total_text=eur(l["total_gross"])) for l in inv["lines"]],
  payment_text=(f"Received {inv['payment']['received_date']}, listed as \"{inv['payment']['list_entity']}\" ({inv['payment']['list_sheet']})" if inv["payment"] else "No payment date found for this invoice."), others=others, has_others=bool(others))}
# ---- served states of the new page
def moment_vm(m, i, event_guests, day=None):
    n = sum(len(l["items"]) for l in m["menu_lines"])
    same = m["guests"] is not None and m["guests"] == event_guests
    return dict(id=f"m{i}", day=day or "", title=m["name_as_written"] or m["service_type"].replace("_", " "), service=m["service_type"].replace("_", " "), guests_text=(f"{m['guests']} guests" if m["guests"] is not None else "same as the event"),
      guests_value="" if (same or m["guests"] is None) else m["guests"], starts="", ends="", items_text=f"{n} items", menu_lines=[dict(segment=l["segment"].replace("_", " "), items=[dict(text=x["text"]) for x in l["items"]]) for l in m["menu_lines"]])
empty = {"client_summary": "Who is it for?", "client_matches": [], "can_create": False, "event": {}, "event_summary": "Dates and guests", "moments": [], "moments_summary": "No moments yet", "open_sections": ["client"], "open_moments": [], "send_text": "Pick a client to begin", "cannot_send": True}
typing = {**empty, "client_summary": "Typing…", "client_matches": [dict(label="Maria Paulo · company"), dict(label="Maria Pais · individual")], "can_create": True}
rita = next(x for x in qs if (x["client"] or "").startswith("Rita"))
eg = 40
filled = {"client_summary": "Rita S. Freitas", "client_matches": [], "can_create": False, "event": dict(starts="19 Mar 10:30", ends="20 Mar 17:00", guests="40", place="Aveiro", guests_hint="same as the event: 40"), "event_summary": "19–20 Mar · 40 guests · Aveiro",
  "moments": [moment_vm(m, i, eg, day=["19 Mar", "19 Mar", "20 Mar", "20 Mar", "20 Mar"][i]) for i, m in enumerate(rita["moments"])], "moments_summary": f"{len(rita['moments'])} moments · {rita['items']} items", "open_sections": ["moments"], "open_moments": ["m0"], "send_text": "Ready to send", "cannot_send": False}
# ---------------- store: shell documents are project-level (shared/ui-data); the pages and their components are the slice's
rows = [dict(id=uid("doc:" + d["name"]), active=True, kind=d["kind"], name=d["name"], version=1, document=d) for d in (prop_page, prop_detail, new_page, inv_page, inv_detail, prop_filter, prop_table, inv_filter, inv_table)]
shared = os.path.join(PROJ, "slices/finger-food/shared")
def store(sub, entities):
    os.makedirs(f"{shared}/{sub}", exist_ok=True)
    json.dump({"file": {"id": uid("file:" + sub), "entityType": sub, "appType": "main", "slice": "finger-food", "version": "v1"}, "entities": entities}, open(f"{shared}/{sub}/core.json", "w"), indent=1, ensure_ascii=False)
    json.dump({"entityType": sub, "parts": [{"path": f"shared/{sub}/core.json", "active": True}]}, open(f"{shared}/{sub}/index.json", "w"), indent=1)
store("ui-data", rows)
WORLD = json.load(open(os.path.join(os.path.dirname(__file__), "world.json")))
snaps, designs = [], []
by = {r["name"]: r for r in rows}
for name, title, served in (("ProposalsPage", "Proposals", served_proposals), ("ProposalPage", "A proposal", served_proposal), ("InvoicesPage", "Invoices", served_invoices), ("InvoiceDetailPage", "An invoice", served_invoice)):
    sid = uid("snap:" + name); snaps.append(dict(id=sid, active=True, version="v1", createdAt=now, updatedAt=now, title=title, world=WORLD["world"], activeUserId=WORLD["user"], activeOrganizationId=WORLD["org"], served=served, entities={}))
    designs.append(dict(id=uid("design:" + name), active=True, version="v1", createdAt=now, updatedAt=now, kind="default-screen", referenceLabel="Default", isDefault=True, name=name + " · document", title=title, surface="web", world=WORLD["world"], params={}, uiDataId=by[name]["id"], uiEntitiesSnapshotId=sid, documentName=name, documentVersion=1))
for title, served, st in (("New proposal: empty", empty, {}), ("New proposal: typing a name", typing, {"client": "Maria Pa"}), ("New proposal: filled in", filled, {"client": "Rita S. Freitas"})):
    sid = uid("snap:new:" + title); snaps.append(dict(id=sid, active=True, version="v1", createdAt=now, updatedAt=now, title=title, world=WORLD["world"], activeUserId=WORLD["user"], activeOrganizationId=WORLD["org"], served=served, entities={}, state=st))
    designs.append(dict(id=uid("design:new:" + title), active=True, version="v1", createdAt=now, updatedAt=now, kind="default-screen", referenceLabel="Default", isDefault=False, name="ProposalNewPage · " + title, title=title, surface="web", world=WORLD["world"], params={}, uiDataId=by["ProposalNewPage"]["id"], uiEntitiesSnapshotId=sid, documentName="ProposalNewPage", documentVersion=1))
store("ui-entities-snapshots", snaps); store("designs", designs)
print("documents", [r["name"] for r in rows], "| designs", len(designs))
