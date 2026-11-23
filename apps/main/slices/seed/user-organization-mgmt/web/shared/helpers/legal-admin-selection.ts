/** A (type, scope) pair the authoring surface acts on. */
export interface LegalAdminSelection {
  type: string;
  /** Null = platform scope. */
  orgTypeId: string | null;
}
