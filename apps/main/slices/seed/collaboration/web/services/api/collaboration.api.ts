// Calls the /collaboration routes.
import type { DocumentChange, DocumentMember, LeaseAction, LeaseAnswer, LiveDocument, SavedDocument, SentChanges } from "../../../shared/types";
import { clientUrl, http } from "./http";

const base = (kind: string, id: string) => `/collaboration/${kind}/${encodeURIComponent(id)}`;

export const collaborationApi = {
  join: <TDocument>(kind: string, id: string) => http().request<LiveDocument<TDocument>>(clientUrl(`${base(kind, id)}/join`), { method: "POST" }),
  watch: (kind: string, id: string) => http().request<{ watching: boolean; members: DocumentMember[] }>(clientUrl(`${base(kind, id)}/watch`), { method: "POST" }),
  unwatch: (kind: string, id: string) => http().request<{ watching: boolean; members: DocumentMember[] }>(clientUrl(`${base(kind, id)}/unwatch`), { method: "POST" }),
  leave: (kind: string, id: string) => http().request<{ left: boolean }>(clientUrl(`${base(kind, id)}/leave`), { method: "POST" }),
  sendLease: (kind: string, id: string, paths: string[][], action: LeaseAction, operation?: string) =>
    http().request<LeaseAnswer>(clientUrl(`${base(kind, id)}/leases`), { method: "POST", body: JSON.stringify({ paths, action, operation }) }),
  save: (kind: string, id: string, details: object) =>
    http().request<SavedDocument>(clientUrl(`${base(kind, id)}/save`), { method: "POST", body: JSON.stringify(details) }),
  sendChangesIfUnchanged: (kind: string, id: string, changes: DocumentChange[]) =>
    http().request<SentChanges>(clientUrl(`${base(kind, id)}/changes`), { method: "POST", body: JSON.stringify({ changes, ifUnchanged: true }) }),
  sendChanges: (kind: string, id: string, changes: DocumentChange[]) =>
    http().request<SentChanges>(clientUrl(`${base(kind, id)}/changes`), { method: "POST", body: JSON.stringify({ changes }) }),
};
