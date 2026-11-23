// @plantuml/core ships no types: what this component uses of it
declare module "@plantuml/core" {
  export function renderToString(lines: string[], onSuccess: (svg: string) => void, onError: (message: string) => void, options?: { dark?: boolean; maxSvgSize?: number }): void;
  export function render(lines: string[], targetId: string, options?: { dark?: boolean }): void;
}
declare module "@plantuml/core/viz-global.js" {
  const Viz: unknown;
  export default Viz;
  export { Viz };
}
