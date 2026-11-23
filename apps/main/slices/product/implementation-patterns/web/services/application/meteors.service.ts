/**
 * Meteors, published and the organization's. Reads are query options; writes
 * refresh every meteor query, so lists and details never drift.
 */

import { queryOptions } from "@tanstack/react-query";
import type { CreateMeteorInput, MeteorListQuery, UpdateMeteorInput } from "../../../shared/types";
import { locksService } from "@modules/collaboration/web";
import { meteorsApi } from "../api/meteors.api";
import { liveMeteorService } from "./live-meteor.service";
import { mounted } from "./mount";

const keys = {
  all: ["meteors"] as const,
  published: (query: MeteorListQuery) => ["meteors", "published", query] as const,
  publishedOne: (meteorId: string) => ["meteors", "published", "one", meteorId] as const,
  list: (query: MeteorListQuery) => ["meteors", "org", query] as const,
  one: (meteorId: string) => ["meteors", "org", "one", meteorId] as const,
};

const refresh = () => mounted().queryClient.invalidateQueries({ queryKey: keys.all });

export const meteorsService = {
  /** A meteor edited live: open it while its form is on screen, read it from the live-meteor store. */
  liveMeteor: liveMeteorService,
  /** A meteor's lock and what the caller may do about it: collaboration's query, for the meteor. */
  getLockState: (meteorId: string): ReturnType<typeof locksService.getLockState> => locksService.getLockState("meteor", meteorId),
  /** The locks among a page of meteors: one request for the whole page. */
  getLocksOf: (meteorIds: string[]): ReturnType<typeof locksService.getLocksOf> => locksService.getLocksOf("meteor", meteorIds),
  getPublishedMeteors: (query: MeteorListQuery) =>
    queryOptions({ queryKey: keys.published(query), queryFn: () => meteorsApi.listPublished(query) }),
  getPublishedMeteor: (meteorId: string) =>
    queryOptions({ queryKey: keys.publishedOne(meteorId), queryFn: () => meteorsApi.getPublished(meteorId), retry: false }),
  getOrgMeteors: (query: MeteorListQuery) =>
    queryOptions({ queryKey: keys.list(query), queryFn: () => meteorsApi.list(query) }),
  getOrgMeteor: (meteorId: string) =>
    queryOptions({ queryKey: keys.one(meteorId), queryFn: () => meteorsApi.get(meteorId), retry: false }),

  create: async (input: CreateMeteorInput) => {
    const meteor = await meteorsApi.create(input);
    await refresh();
    return meteor;
  },
  update: async (meteorId: string, input: UpdateMeteorInput) => {
    const meteor = await meteorsApi.update(meteorId, input);
    await refresh();
    return meteor;
  },
  /** Everything about meteors is read again: a change made elsewhere, a restored version. */
  refresh,
  remove: async (meteorId: string) => {
    await meteorsApi.remove(meteorId);
    await refresh();
  },
};
