// The slice's tables — the package's ./models entry. The core re-exports these so drizzle-kit and the db client see
// them, and maps document_lock in the access rules' table map.
export * from "./document-lock.model";
export * from "./document-lock.schemas";
