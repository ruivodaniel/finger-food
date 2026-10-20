/**
 * Fallback rendered when the shape resolver returns `null` for the selected
 * path, OR when a shape resolves but no editor is registered for it yet.
 *
 * Theme-safe (zinc palette). Does NOT crash; surfaces the path + raw JSON
 * so the user has something to act on while we migrate the remaining shapes.
 */
type Props = {
  path: string[];
  raw: unknown;
};

export function UnsupportedShape({ path, raw }: Props) {
  return (
    <div className="flex flex-col gap-3 p-4 text-xs">
      <div>
        <div className="text-zinc-700 font-medium mb-1">No editor yet</div>
        <div className="text-zinc-500">
          The shape at{" "}
          <code className="font-mono text-[10px] bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">
            {path.join(" › ")}
          </code>{" "}
          is not yet registered in the theme editor.
        </div>
      </div>
      <details className="text-[10px] text-zinc-400">
        <summary className="cursor-pointer hover:text-zinc-600 select-none">
          Raw value
        </summary>
        <pre className="mt-1 p-2 bg-zinc-50 rounded border border-zinc-200 overflow-auto max-h-64 text-[10px] text-zinc-600 font-mono">
          {raw === undefined ? "(undefined)" : JSON.stringify(raw, null, 2)}
        </pre>
      </details>
    </div>
  );
}
