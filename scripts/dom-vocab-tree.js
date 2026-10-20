/**
 * dom-vocab-tree.js
 *
 * Usage:
 *   domVocabTree()
 *   domVocabTree('[data-testid="organizations-list-page"]')
 *   domVocabTree('body', { depth: 4 })
 */
window.domVocabTree = function domVocabTree(selector = 'body', opts = {}) {
  const { depth = Infinity } = opts;

  const SKIP = new Set([
    'SCRIPT','STYLE','NOSCRIPT',
    'SVG','PATH','CIRCLE','LINE','POLYLINE','RECT',
    'POLYGON','ELLIPSE','G','DEFS','USE','CLIPPATH',
  ]);

  function label(el) {
    const tag     = el.tagName.toLowerCase();
    const layout  = el.getAttribute('layout');
    const element = el.getAttribute('element');
    const concept = el.getAttribute('concept');
    const testid  = el.getAttribute('data-testid');

    const vocab = [
      layout  ? `layout="${layout}"`   : null,
      element ? `element="${element}"` : null,
      concept ? `concept="${concept}"` : null,
    ].filter(Boolean).join(' ');

    const id = testid ? ` #${testid}` : '';
    return `${tag}${id} ${vocab || '// BARE'}`;
  }

  const lines = [];

  function walk(el, prefix, isLast, d) {
    if (!el || el.nodeType !== 1) return;
    if (SKIP.has(el.tagName)) return;
    if (d > depth) return;

    const connector = isLast ? '└── ' : '├── ';
    lines.push(prefix + connector + label(el));

    const children = [...el.children].filter(c => !SKIP.has(c.tagName));
    const childPfx = prefix + (isLast ? '    ' : '│   ');
    children.forEach((c, i) => walk(c, childPfx, i === children.length - 1, d + 1));
  }

  const root = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector;

  if (!root) { console.warn('not found:', selector); return; }

  lines.push(label(root));
  const children = [...root.children].filter(c => !SKIP.has(c.tagName));
  children.forEach((c, i) => walk(c, '', i === children.length - 1, 1));

  lines.forEach((l, i) => console.log(String(i).padStart(3, '0') + '  ' + l));
};

console.log('domVocabTree ready');
