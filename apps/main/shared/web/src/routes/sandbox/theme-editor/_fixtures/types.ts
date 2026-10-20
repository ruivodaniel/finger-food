export type Fixture = {
  /** Slash-joined path — also the URL splat value. e.g. "elements/foundation/typography". */
  id: string;
  /** Folder path mirroring the html/ directory structure. */
  path: string[];
  label: string;
  html: string;
};
