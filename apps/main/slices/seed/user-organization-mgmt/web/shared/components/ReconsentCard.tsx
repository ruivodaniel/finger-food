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
import { Button, Card, Content, Footer, Header, Alert, AlertDescription, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { legalDocumentHref } from "../helpers/legal-doc-paths";
import { ConsentDecisionList } from "./ConsentDecisionList";
import type { PendingConsentGroupView } from "../../../shared/types/domain";
import { onboardingService } from "../../services/application/onboarding.service";
import { consentsService } from "../../services/application/consents.service";
import { isApiError } from "../helpers/api-error";

export function ReconsentCard(): React.ReactElement | null {
  const queryClient = useQueryClient();
  const [decisions, setDecisions] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState<string | null>(null);

  const { data: groups } = useQuery({
    ...consentsService.getPendingConsents(),
    refetchOnMount: "always",
  });

  const accept = useMutation({
    mutationFn: (group: PendingConsentGroupView) =>
      consentsService.recordConsent({
        orgTypeId: group.orgTypeId,
        decisions: group.items.map((item) => ({
          type: item.type,
          accepted: decisions[`${group.orgTypeId}:${item.type}`] ?? false,
        })),
      }),
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: onboardingService.keys.gate }),
        queryClient.invalidateQueries({ queryKey: consentsService.keys.pendingConsents }),
      ]);
    },
    onError: (e) =>
      setError(isApiError(e) ? e.message : "something went wrong"),
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
    <Stack dir="col" scale="lg" data-testid="reconsent-card">
      {groups.map((group) => (
        <Card key={group.orgTypeId ?? "platform"} position="fill">
          <Header>
            <Text as="h2" type="heading4">{group.label} terms</Text>
          </Header>
          <Content>
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
          </Content>
          <Footer position="fill">
            <Stack dir="row" justify="end" scale="sm" size="fill">
              <Button
                data-testid={`reconsent-accept-${group.orgTypeId ?? "platform"}`}
                disabled={!groupReady(group) || accept.isPending}
                onClick={() => accept.mutate(group)}
              >
                Accept
              </Button>
            </Stack>
          </Footer>
        </Card>
      ))}
      {error && (
        <Alert status="error" data-testid="reconsent-error"><AlertDescription>{error}</AlertDescription></Alert>
      )}
    </Stack>
  );
}
