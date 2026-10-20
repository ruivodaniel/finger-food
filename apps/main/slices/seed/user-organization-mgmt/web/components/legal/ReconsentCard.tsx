/**
 * ReconsentCard — the resolve wizard's consent resolver. Lists every unmet
 * consent obligation grouped by scope (platform / org type), each item
 * linking to its document, and accepts per group. Renders nothing when the
 * caller owes no consent. Accepting invalidates the gate query, which
 * advances the wizard.
 *
 * A Stack of Cards, one per group: the header names the group's terms, the
 * content is the ConsentDecisionList, the footer the group's Accept. Errors
 * as an Alert. No inline styles.
 */

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { queryKeys } from "../../lib/query-keys";
import { legalDocumentHref } from "../../lib/legal-doc-paths";
import { ConsentDecisionList } from "./ConsentDecisionList";
import { ApiError } from "../../lib/api-client";
import type { PendingConsentGroupView } from "../../../shared/types/domain";
import { StatusAlert } from "../StatusAlert";

export function ReconsentCard(): React.ReactElement | null {
  const { client } = useUserOrgMgmtContext();
  const queryClient = useQueryClient();
  const [decisions, setDecisions] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState<string | null>(null);

  const { data: groups } = useQuery({
    queryKey: queryKeys.pendingConsents,
    queryFn: () => client.getPendingConsents(),
    refetchOnMount: "always",
  });

  const accept = useMutation({
    mutationFn: (group: PendingConsentGroupView) =>
      client.submitConsent({
        orgTypeId: group.orgTypeId,
        decisions: group.items.map((item) => ({
          type: item.type,
          accepted: decisions[`${group.orgTypeId}:${item.type}`] ?? false,
        })),
      }),
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.gate }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pendingConsents }),
      ]);
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "something went wrong"),
  });

  if (!groups || groups.length === 0) return null;

  // Every mandatory item with a live document must be checked; waived items
  // (document null) are never demanded — mirrors the server's rule.
  const groupReady = (group: PendingConsentGroupView) =>
    group.items.every(
      (item) =>
        !item.mandatory ||
        item.document === null ||
        (decisions[`${group.orgTypeId}:${item.type}`] ?? false),
    );

  return (
    <Stack dir="col" gap={16} data-testid="reconsent-card" className="w-full">
      {groups.map((group) => (
        <Card key={group.orgTypeId ?? "platform"} position="fill">
          <CardHeader>
            <h2 element="type--heading4">{group.label} terms</h2>
          </CardHeader>
          <CardContent>
            <ConsentDecisionList
              items={group.items}
              decisions={Object.fromEntries(
                group.items.map((item) => [
                  item.type,
                  decisions[`${group.orgTypeId}:${item.type}`] ?? false,
                ]),
              )}
              onDecisionChange={(type, accepted) =>
                setDecisions((d) => ({
                  ...d,
                  [`${group.orgTypeId}:${type}`]: accepted,
                }))
              }
              viewerHrefFor={(item) =>
                item.document
                  ? legalDocumentHref(item.type, { docId: item.document.id })
                  : undefined
              }
              testIdPrefix={`reconsent-${group.orgTypeId ?? "platform"}`}
            />
          </CardContent>
          <CardFooter position="fill">
            <Stack dir="row" justify="end" gap={8} className="w-full">
              <Button
                data-testid={`reconsent-accept-${group.orgTypeId ?? "platform"}`}
                disabled={!groupReady(group) || accept.isPending}
                onClick={() => accept.mutate(group)}
              >
                Accept
              </Button>
            </Stack>
          </CardFooter>
        </Card>
      ))}
      {error && (
        <StatusAlert status="error" testId="reconsent-error">{error}</StatusAlert>
      )}
    </Stack>
  );
}
