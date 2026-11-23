/** the height of the whole page: the document's, plus what every region that scrolls inside it hides. Self-contained: the camera runs its text inside the page */
export function wholeHeight(doc: Document): number {
  let hidden = 0;
  doc.querySelectorAll<HTMLElement>("*").forEach((el) => { const over = el.scrollHeight - el.clientHeight; if (over > hidden && /auto|scroll/.test(getComputedStyle(el).overflowY)) hidden = over; });
  return doc.documentElement.scrollHeight + hidden;
}
