// Calls the /collaboration/locks routes.
import type { DocumentLockPage, DocumentLockState, DocumentLockView } from "../../../shared/types";
import { clientUrl, http } from "./http";

const lockPath = (kind: string, documentId: string) => clientUrl(`/collaboration/locks/${encodeURIComponent(kind)}/${encodeURIComponent(documentId)}`);

export const locksApi = {
  getAll: (query: { page: number; pageSize: number }) =>
    http().request<DocumentLockPage>(clientUrl(`/collaboration/locks?${new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) })}`)),
  getLocksOf: (kind: string, documentIds: string[]) =>
    http().request<DocumentLockView[]>(clientUrl(`/collaboration/locks/${encodeURIComponent(kind)}?${new URLSearchParams({ ids: documentIds.join(",") })}`)),
  getState: (kind: string, documentId: string) => http().request<DocumentLockState>(lockPath(kind, documentId)),
  lock: (kind: string, documentId: string) => http().request<DocumentLockView>(lockPath(kind, documentId), { method: "PUT" }),
  unlock: (kind: string, documentId: string) => http().request<{ unlocked: boolean }>(lockPath(kind, documentId), { method: "DELETE" }),
};
