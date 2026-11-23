import * as React from "react";
import { latest, type Binding, type ComponentLock, type Doc, type EntitiesSnapshot, type Json, type Node, type Registry, type Surface } from "../types";
import { evalExpr, isExpr, opOf, type Scope } from "../expr";
import { READ_STATES } from "../dictionary";
import { run, type Env, type Runtime } from "../actions";
import { builtinsOf, componentsOf, libraryOf } from "../schema";

export type { Binding, ComponentLock, EntitiesSnapshot } from "../types";

// The one trusted interpreter, running in the live viewer. A node's `type` names a library component (drawn by name from the package, with the
// document's props and its `on.<event>` wired to the component's `on<Event>`), one of five built-in HTML nodes, or a component the project's binding
// hosts. Data comes from the named contracts and effects from the named actions, both implemented by the binding against the project's API client.

type Any = Record<string, unknown>;

/** a text: an array of scalars reads as a list, nothing as nothing */
const flat = (v: unknown) => (Array.isArray(v) ? v.join(", ") : v === undefined || v === null ? "" : String(v));

const EntitiesContext = React.createContext<EntitiesSnapshot | null>(null);
/** a runtime the host keeps (its UI state outside React), instead of the page's own: the design cockpit reads and edits a document's state through it. Absent: the page keeps its own. */
const ExternalRuntimeContext = React.createContext<Runtime | null>(null);
const LockContext = React.createContext<ComponentLock | null>(null);
/** the version each component written as code was given when the lock was made: a name with no number takes it */
const CodeLockContext = React.createContext<Record<string, number> | null>(null);
/** the content a referencing document handed to this component's slots, already drawn in the referencing document's scope */
const SlotsContext = React.createContext<Record<string, React.ReactNode> | null>(null);

/** the surface of the screen being drawn: the library package its nodes come from */
const SurfaceContext = React.createContext<Surface>("web");
/** the surface of the screen being drawn, for the binding (a product action may differ by surface: where "home" is) */
export const useSurface = () => React.useContext(SurfaceContext);

const BindingContext = React.createContext<Binding | null>(null);
const RegistryContext = React.createContext<Registry | null>(null);
const useBinding = () => React.useContext(BindingContext)!;
const useRegistry = () => React.useContext(RegistryContext)!;


const IDLE = { isLoading: false, isFetching: false, isRefetching: false, isError: false, error: null };

/** one instance of a document (a page, or a component with its arguments): its own data and its own UI state */
function Instance({ doc, args, path, rt, emitters, slots }: { doc: Doc; args: Any; path: string; rt: Runtime; emitters?: Record<string, (payload: Any) => void>; slots?: Record<string, React.ReactNode> }) {
  const binding = useBinding();
  const env: Env = { b: binding, e: binding.useEnv() };
  const entitiesCtx = React.useContext(EntitiesContext);
  const state = { ...(doc.state ?? {}), ...(rt.states[path] ?? {}) } as Record<string, Json>;
  // where each read stands, by its name and by TanStack Query's names (dictionary: READ_STATES). What the document shows in each state is the document's to say
  // v3: the store, read only and bound by name (`store.<key>`); absent when the binding gives none
  const store = (binding.useStore?.() ?? {}) as Any;
  const scope: Scope = { ...args, state, store, data: {} as Any, calc: {} as Any, ...Object.fromEntries(READ_STATES.map((w) => [w, {}])) };
  // the last data each read gave, for the reads that keep it while a request with new params is on its way
  const previous = React.useRef<Record<string, unknown>>({});
  const calc = (): void => { for (const [k, c] of Object.entries(doc.calc ?? {})) { try { (scope.calc as Any)[k] = evalExpr(c, scope); } catch { (scope.calc as Any)[k] = undefined; } } };
  // data in order, the calc recomputed between: a later contract can depend on what an earlier one returned
  for (const [k, d] of Object.entries(doc.data ?? {})) {
    calc();
    let enabled = true, params: Any = {};
    try { enabled = d.when === undefined ? true : !!evalExpr(d.when, scope); params = Object.fromEntries(Object.entries(d.params ?? {}).map(([pk, pv]) => [pk, evalExpr(pv, scope)])); } catch { enabled = false; }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    (scope.data as Any)[k] = binding.useContract(d.source, params, enabled, entitiesCtx);
    let got = (scope.data as Any)[k];
    const st = !enabled ? IDLE : binding.status ? binding.status(d.source, params) : { ...IDLE, isLoading: got === undefined, isFetching: got === undefined };
    // placeholderData keepPreviousData: no data yet for these params, so the read gives what it had; it is not loading, it is fetching
    const placeholder = d.placeholderData === "keepPreviousData" && got === undefined && st.isFetching && previous.current[k] !== undefined;
    if (placeholder) { got = previous.current[k]; (scope.data as Any)[k] = got; } else if (got !== undefined) previous.current[k] = got;
    const states: Record<(typeof READ_STATES)[number], unknown> = { ...st, isLoading: st.isLoading && !placeholder, isPlaceholderData: placeholder };
    for (const w of READ_STATES) ((scope as Any)[w] as Any)[k] = states[w];
  }
  calc();
  const view = <View node={doc.root} scope={scope} path={path} instance={path} rt={rt} env={env} emit={(e, p) => emitters?.[e]?.(p)} />;
  return slots ? <SlotsContext.Provider value={slots}>{view}</SlotsContext.Provider> : view;
}

const Err = ({ text }: { text: string }) => <span style={{ color: "#c0392b", fontSize: 11 }}>{text}</span>;
const isNode = (v: unknown): v is Node => !!v && typeof v === "object" && !Array.isArray(v) && ("type" in (v as object) || "use" in (v as object));
const isNodes = (v: unknown): v is Node[] => Array.isArray(v) && v.length > 0 && v.every(isNode);
/** an in-app link never navigates the frame natively: navigation is an action of the document */
const inApp = (href: unknown) => typeof href === "string" && href.startsWith("/");

/** one node. A parent that composes onto its child (Radix `asChild`) clones this element with its own props: they arrive as `extra` and go onto what is drawn. */
function View({ node, scope, path, instance, rt, env, emit, ...extra }: { node: Node; scope: Scope; path: string; instance: string; rt: Runtime; env: Env; emit: (e: string, p: Any) => void } & Any): React.ReactElement | null {
  const lock = React.useContext(LockContext);
  const codeLock = React.useContext(CodeLockContext);
  const mySlots = React.useContext(SlotsContext);
  const surface = React.useContext(SurfaceContext);
  const reg = useRegistry();
  const binding = useBinding();
  try {
    if (node.when !== undefined && !evalExpr(node.when, scope)) return null;
    if (node.repeat) {
      const list = evalExpr({ bind: node.repeat.each }, scope);
      const { repeat, ...rest } = node;
      return <>{(Array.isArray(list) ? list : []).map((item, i) => <View key={i} node={rest} scope={{ ...scope, [repeat.as]: item }} path={`${path}[${i}]`} instance={instance} rt={rt} env={env} emit={emit} />)}</>;
    }
    const draw = (nodes: Node[], at: string) => nodes.map((c, i) => <View key={i} node={c} scope={scope} path={`${at}.${i}`} instance={instance} rt={rt} env={env} emit={emit} />);
    if (node.use) {
      const versions = reg.components[node.use.component];
      const v = node.use.version === "latest" ? (lock?.[node.use.component]?.version ?? latest(reg, node.use.component)) : node.use.version;
      const doc = versions?.[v];
      if (!doc) return <Err text={`no ${node.use.component} version ${v}`} />;
      const args = Object.fromEntries(Object.entries(node.args ?? {}).map(([k, a]) => [k, evalExpr(a, scope)]));
      const emitters = Object.fromEntries(Object.entries(node.on ?? {}).map(([ev, list]) => [ev, (payload: Any) => { void run(list, { ...scope, event: payload }, instance, rt, env, emit); }]));
      const slots = Object.fromEntries(Object.entries(node.slots ?? {}).map(([name, nodes]) => [name, <SlotsContext.Provider key={name} value={mySlots}>{draw(nodes, `${path}/${name}`)}</SlotsContext.Provider>]));
      return <Instance doc={doc} args={args} path={`${path}/${node.use.component}@${v}`} rt={rt} emitters={emitters} slots={node.slots ? slots : undefined} />;
    }
    // the props: every value evaluated; a value that is a node (or nodes) is drawn — a prop of kind "node" (an icon, an action)
    const p: Any = {};
    // a component written as code: by its name and its version, in what the consumer handed over
    const resolved = node.type ? binding.resolve?.(node.type, node.version ?? codeLock?.[node.type]) ?? null : null;
    if (node.type && node.version !== undefined && !resolved) return <Err text={binding.resolve ? `no ${node.type} version ${node.version}` : `${node.type} version ${node.version} is asked, and no code registry was handed over`} />;
    const prim = resolved?.prim ?? libraryOf(surface)[node.type as string];
    for (const [k, v] of Object.entries(node.props ?? {})) {
      // a template prop (ListTree's renderNode): the component calls it per item; the engine draws the document's node with `item` and `ctx` in scope. No code enters the document.
      if (prim?.props[k] === "template" && isNode(v)) p[k] = (item: unknown, ctx: unknown) => <View node={v} scope={{ ...scope, item: item as Json, ctx: ctx as Json }} path={`${path}.${k}`} instance={instance} rt={rt} env={env} emit={emit} />;
      // a list of items that hold templates (RichTable's columns, each with its `render`): the item is evaluated as data, its template keys are drawn per row with `item` in scope
      else if (prim?.itemTemplates?.[k] && Array.isArray(v)) p[k] = v.map((raw, i) => {
        const it = (isExpr(raw) && opOf(raw) === "obj" ? raw.obj : raw) as Record<string, unknown>;
        const keys = prim.itemTemplates![k].filter((t) => isNode(it?.[t]));
        const data = evalExpr({ obj: Object.fromEntries(Object.entries(it ?? {}).filter(([n]) => !keys.includes(n))) }, scope) as Record<string, unknown>;
        for (const t of keys) data[t] = (item: unknown, ctx: unknown) => <View node={it[t] as Node} scope={{ ...scope, item: item as Json, ctx: ctx as Json }} path={`${path}.${k}.${i}.${t}`} instance={instance} rt={rt} env={env} emit={emit} />;
        return data;
      });
      else if (isNode(v)) p[k] = draw([v], `${path}.${k}`)[0];
      else if (isNodes(v)) p[k] = <>{draw(v, `${path}.${k}`)}</>;
      else p[k] = isExpr(v) || Array.isArray(v) ? evalExpr(v, scope) : v;
    }
    const { key, ...props } = p;
    // the content: the `children` nodes (one child stays one element, so a parent may compose onto it), else the `children` prop (a text)
    const drawn = node.children?.length ? draw(node.children, path) : null;
    const kids: React.ReactNode = drawn ? (drawn.length === 1 ? drawn[0] : drawn) : props.children !== undefined ? (React.isValidElement(props.children) ? props.children : flat(props.children)) : undefined;
    // what a composing parent handed down (its className, attributes, handlers): onto this node, under its own props
    const inherited = (mine: Any): Any => { const out: Any = { ...extra, ...mine }; for (const k of Object.keys(extra)) if (/^on[A-Z]/.test(k) && typeof mine[k] === "function" && typeof extra[k] === "function") out[k] = (...a: unknown[]) => { (extra[k] as (...a: unknown[]) => void)(...a); (mine[k] as (...a: unknown[]) => void)(...a); }; return out; };
    delete props.children;
    // the events: `on.<name>` is the component's `on<Name>`; the handler's first argument is `event` in the actions' scope
    const fire = (ev: string, event: unknown = undefined) => { void run(node.on?.[ev], { ...scope, event }, instance, rt, env, emit); };
    const handlers: Any = {};
    for (const ev of Object.keys(node.on ?? {})) handlers["on" + ev[0].toUpperCase() + ev.slice(1)] = (first: unknown) => fire(ev, first);
    const type = node.type as string;
    const k = typeof key === "string" || typeof key === "number" ? key : undefined;
    // 1. the built-ins: a fragment and a slot on any surface; on the web, the HTML the library has no component for
    if (type === "Fragment") return <React.Fragment key={k}>{kids}</React.Fragment>;
    if (type === "Slot") return <>{mySlots?.[props.name as string]}</>;
    const html = surface === "web";
    if (html && type === "Form") return <form key={k} {...(inherited(props) as object)} onSubmit={(e) => { e.preventDefault(); fire("submit"); }}>{kids}</form>;
    if (html && type === "Text") {
      const { as, ...attrs } = props;
      if (node.on?.click || inApp(attrs.href)) attrs.onClick = (e: React.MouseEvent) => { if (node.on?.click || inApp(attrs.href)) e.preventDefault(); fire("click"); };
      return React.createElement((as as string) ?? "span", { key: k, ...inherited(attrs) }, kids);
    }
    if (html && type === "Img") return <img key={k} {...(inherited(props) as object)} alt={(props.alt as string) ?? ""} />;
    if (html && type === "Html") { const { html: markup, ...attrs } = props; return <div key={k} {...(inherited(attrs) as object)} dangerouslySetInnerHTML={{ __html: String(markup ?? "") }} />; }
    // 2. a component the project hosts (its binding names it); 3. a library component, by name
    const H = binding.hosted[type] as React.ComponentType<Any> | undefined;
    const C = (H ?? resolved?.component ?? componentsOf(surface)[type]) as React.ComponentType<Any> | undefined;
    if (!C) return <Err text={`unknown ${surface} component ${type}`} />;
    if (builtinsOf(surface)[type]) return <Err text={`${type} is a built-in`} />;
    return <C key={k} {...inherited({ ...props, ...handlers })} {...(H ? { fire } : {})}>{kids}</C>;
  } catch (e) { return <Err text={String(e)} />; }
}

/** a page document, mounted as a screen: the project's providers, the document registry, the lock and the UI entities snapshot it serves.
 *  The page is bound to the key the binding names (the product's rule: the active organization): when it changes the document's
 *  instance remounts, so every data contract asks again and every local state starts over. */
export type { Runtime };
export function DocumentScreen({ doc, registry, binding, entities = null, lock = null, codeLock = null, runtime = null, args = NO_ARGS }: { /** the versions a lock keeps for the components written as code (Lock.codeVersions) */ codeLock?: Record<string, number> | null; doc: Doc; registry: Registry; binding: Binding; /** the values of the page's `params`: what the route names in the path, and the query */ args?: Any; entities?: EntitiesSnapshot | null; lock?: ComponentLock | null; /** the host's own runtime (the state kept outside) */ runtime?: Runtime | null }) {
  return (
    <SurfaceContext.Provider value={doc.surface ?? "web"}>
    <React.Suspense fallback={null}>
    <BindingContext.Provider value={binding}>
      <RegistryContext.Provider value={registry}>
        <binding.Provider>
          <LockContext.Provider value={lock}>
          <CodeLockContext.Provider value={codeLock}>
            <EntitiesContext.Provider value={entities}>
              <ExternalRuntimeContext.Provider value={runtime}>
                <ScopeBound doc={doc} args={args} />
              </ExternalRuntimeContext.Provider>
            </EntitiesContext.Provider>
          </CodeLockContext.Provider>
          </LockContext.Provider>
        </binding.Provider>
      </RegistryContext.Provider>
    </BindingContext.Provider>
    </React.Suspense>
    </SurfaceContext.Provider>
  );
}

const NO_ARGS: Any = {};
function ScopeBound({ doc, args }: { doc: Doc; args: Any }) {
  const key = useBinding().useScopeKey();
  return <Page_ key={key} doc={doc} args={args} />;
}

function Page_({ doc: declared, args }: { doc: Doc; args: Any }) {
  // the screen starts from the state its snapshot serves (only the keys the document declares); it adds no logic
  const served = React.useContext(EntitiesContext)?.state;
  const doc = React.useMemo(() => (served ? { ...declared, state: { ...(declared.state ?? {}), ...Object.fromEntries(Object.entries(served).filter(([k]) => k in (declared.state ?? {}))) } } : declared), [declared, served]);
  const [states, setStates] = React.useState<Record<string, Record<string, Json>>>({});
  const own: Runtime = React.useMemo(() => ({ states, setState: (inst, k, v) => setStates((s) => ({ ...s, [inst]: { ...(s[inst] ?? {}), [k]: v } })) }), [states]);
  const rt = React.useContext(ExternalRuntimeContext) ?? own;
  return <Instance doc={doc} args={args} path={`/${doc.name}`} rt={rt} />;
}
