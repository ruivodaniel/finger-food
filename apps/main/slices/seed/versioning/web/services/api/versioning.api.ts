// Calls the /versioned routes.
import type { BranchView, CloneVersionInput, Comparison, History, MergeVersionsInput, ReleaseVersionInput, ReleaseView, VersionAt, VersionView } from "../../../shared/types";
import type { View } from "../../shared/components/types";
import { clientUrl, http } from "./http";

export const versioningApi = {
  getHistory: (entity: string, entityId: string) => http().request<History>(clientUrl(`/versioned/${entity}/${entityId}/history`)),
  readAt: (entity: string, entityId: string, view: View) => {
    const query = new URLSearchParams();
    if (view.branch) query.set("branch", view.branch);
    if (view.at) query.set("at", view.at);
    const queryText = query.toString();
    return http().request<VersionAt>(clientUrl(`/versioned/${entity}/${entityId}${queryText ? `?${queryText}` : ""}`));
  },
  readVersion: (entity: string, entityId: string, versionId: string) => http().request<VersionAt>(clientUrl(`/versioned/${entity}/${entityId}/versions/${versionId}`)),
  compare: (entity: string, entityId: string, from: string, to: string) =>
    http().request<Comparison>(clientUrl(`/versioned/${entity}/${entityId}/compare?${new URLSearchParams({ from, to })}`)),
  release: (entity: string, entityId: string, input: ReleaseVersionInput) =>
    http().request<ReleaseView>(clientUrl(`/versioned/${entity}/${entityId}/releases`), { method: "POST", body: JSON.stringify(input) }),
  merge: (entity: string, entityId: string, input: MergeVersionsInput) =>
    http().request<VersionView>(clientUrl(`/versioned/${entity}/${entityId}/merge`), { method: "POST", body: JSON.stringify(input) }),
  branchHierarchy: (entity: string, entityId: string, name: string) =>
    http().request<{ entity: string; entityId: string }[]>(clientUrl(`/versioned/${entity}/${entityId}/branch-hierarchy`), { method: "POST", body: JSON.stringify({ name }) }),
  archiveBranch: (entity: string, entityId: string, branch: string) =>
    http().request<BranchView>(clientUrl(`/versioned/${entity}/${entityId}/branches/${encodeURIComponent(branch)}/archive`), { method: "POST" }),
  cloneVersion: (entity: string, entityId: string, input: CloneVersionInput) =>
    http().request<VersionView>(clientUrl(`/versioned/${entity}/${entityId}/clone`), { method: "POST", body: JSON.stringify(input) }),
};
