/**
 * The credits hooks — the owner's summary, lots and ledger. Credits are spent
 * elsewhere (another slice's action, another member), so what these hold is
 * never taken as fresh: a page that shows them asks again when it opens.
 * `poll` looks again for a short while: credits bought at Checkout land when
 * the webhook does.
 */

import { useQuery } from "@tanstack/react-query";
import { creditsService, type CreditsTarget, type PageQuery } from "../../services/application/credits.service";

export type { CreditsTarget } from "../../services/application/credits.service";

const POLL_MS = 2_000;
const every = (poll?: boolean) => (poll ? POLL_MS : false);

export function useCreditsSummary(target: CreditsTarget, options: { poll?: boolean } = {}) {
  return useQuery({ ...creditsService.summary(target), staleTime: 0, refetchInterval: every(options.poll) });
}

export function useLots(target: CreditsTarget, page: PageQuery, options: { poll?: boolean } = {}) {
  return useQuery({ ...creditsService.lots(target, page), staleTime: 0, refetchInterval: every(options.poll) });
}

export function useLedger(target: CreditsTarget, page: PageQuery, options: { poll?: boolean } = {}) {
  return useQuery({ ...creditsService.ledger(target, page), staleTime: 0, refetchInterval: every(options.poll) });
}
