// What the versioning components share. They show the versions of one entity; only VersionedEntity fetches.
import type { ReactNode } from "react";
import type { FieldDelta } from "../../../shared/types";

/** Two versions being compared: the host draws the later one's row, and what it can of the earlier one. */
export interface VersionComparison {
  fromVersionId: string;
  toVersionId: string;
  fromRow: Record<string, unknown>;
  changes: FieldDelta[];
}

/** Which branch, which moment. Absent: main, now. It lives in the URL: the components read it and ask to change it. */
export interface View {
  branch?: string;
  at?: string;
}

export interface PresenterField {
  key: string;
  label?: string;
  render?: (value: unknown) => ReactNode;
}

/** The one entity-specific thing: how a row is titled, and how its fields and its changes are shown. */
export interface Presenter {
  title: (row: Record<string, unknown>) => string;
  /** Without them, every column as text. */
  fields?: PresenterField[];
  /** A version's changes in words, when a list of fields wouldn't say them. */
  summarize?: (changes: FieldDelta[]) => string;
}
