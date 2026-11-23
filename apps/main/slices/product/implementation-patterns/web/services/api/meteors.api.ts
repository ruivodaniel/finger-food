import type { CreateMeteorInput, MeteorListQuery, MeteorView, PublicMeteor, UpdateMeteorInput } from "../../../shared/types";
import { clientUrl, http } from "./http";

function qs(query?: MeteorListQuery): string {
  const params = new URLSearchParams();
  if (query?.search) params.set("search", query.search);
  if (query?.page !== undefined) params.set("page", String(query.page));
  if (query?.pageSize !== undefined) params.set("pageSize", String(query.pageSize));
  const s = params.toString();
  return s ? `?${s}` : "";
}

const id = (meteorId: string) => encodeURIComponent(meteorId);

export const meteorsApi = {
  listPublished: (query?: MeteorListQuery): Promise<{ rows: PublicMeteor[]; total: number }> =>
    http().request(clientUrl(`/meteors${qs(query)}`)),
  getPublished: (meteorId: string): Promise<PublicMeteor> => http().request(clientUrl(`/meteors/${id(meteorId)}`)),
  list: (query?: MeteorListQuery): Promise<{ rows: MeteorView[]; total: number }> =>
    http().request(clientUrl(`/organization/meteors${qs(query)}`)),
  get: (meteorId: string): Promise<MeteorView> => http().request(clientUrl(`/organization/meteors/${id(meteorId)}`)),
  create: (input: CreateMeteorInput): Promise<MeteorView> =>
    http().request(clientUrl("/organization/meteors"), { method: "POST", body: JSON.stringify(input) }),
  update: (meteorId: string, input: UpdateMeteorInput): Promise<MeteorView> =>
    http().request(clientUrl(`/organization/meteors/${id(meteorId)}`), { method: "PATCH", body: JSON.stringify(input) }),
  remove: (meteorId: string): Promise<void> =>
    http()
      .request<unknown>(clientUrl(`/organization/meteors/${id(meteorId)}`), { method: "DELETE" })
      .then(() => undefined),
};
