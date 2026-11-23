/**
 * LegalAgreementsPage — the caller's accepted legal documents: every consent
 * record, newest first, each linking to the immutable version it was given
 * for. Read-only history — re-consent (when a document republishes) happens
 * in the /resolve wizard. Requires a session; redirects to login otherwise.
 *
 * The "Settings" title is the settings frame's; inside, the section heading
 * block, then one Card ("Accepted documents") holding a List — each record a
 * row whose title leads with the org-type scope spelled out ("System admin ·
 * Privacy policy — v1"; personal consents have no scope) over the moment it
 * was accepted, date and time. EmptyState when there are none.
 */

import * as React from "react";
import { Card, Content, Header, Icon, List, ListItem, ListItemContent, ListItemDescription, ListItemIcon, ListItemTitle, Tile, EmptyState, Text, Link } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { legalDocumentHref } from "../../shared/helpers/legal-doc-paths";
import { authenticationService } from "../../services/application/authentication.service";
import { consentsService } from "../../services/application/consents.service";
import { mounted } from "../../services/application/mount";

const TYPE_LABELS: Record<string, string> = {
  termsAndConditions: "Terms and conditions",
  privacyPolicy: "Privacy policy",
  marketing: "Marketing communications",
};

/** The org-type scope, spelled out: system_admin → "System admin". Same
 *  de-underscore-and-capitalise the authoring catalog uses for its labels. */
const orgTypeLabel = (id: string): string =>
  id.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

/** "Accepted 1 Feb 2026 at 15:23" — month spelled, with the time. */
const acceptedLabel = (iso: string): string => {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `Accepted ${date} at ${time}`;
};

export interface LegalAgreementsPageProps {
  loginPath?: string;
}

export function LegalAgreementsPage({
  loginPath = "/login",
}: LegalAgreementsPageProps): React.ReactElement | null {
  const { router } = mounted();
  const { data: sessionData, isLoading: sessionLoading } = useQuery(authenticationService.getSession());

  const { data: records } = useQuery({
    ...consentsService.getConsentHistory(),
    enabled: !!sessionData?.session,
  });

  React.useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      void router?.navigate({ to: loginPath });
    }
  }, [sessionLoading, sessionData, router, loginPath]);

  if (sessionLoading || !sessionData?.session) return null;

  const items = records ?? [];

  return (
    <Stack dir="col" scale="xl" data-testid="legal-agreements-page">
      <Stack dir="col" scale="2xs">
        <Text as="h2" type="heading3">Legal</Text>
        <Text type="body-small" emphasis="quiet">
          The documents you've accepted, and when.
        </Text>
      </Stack>

      <Card>
        <Header>
          <Stack dir="col" scale="3xs">
            <Text as="h2" type="heading4">Accepted documents</Text>
            <Text type="body-small" emphasis="quiet">
              Each entry opens the exact version you accepted, in a new tab.
            </Text>
          </Stack>
        </Header>
        <Content>
          {items.length === 0 ? (
            <EmptyState emphasis="quiet"
              data-testid="legal-agreements-empty"
              icon={<Icon name="fileText" />}
              title="Nothing accepted yet"
              description="Documents you accept show up here with their version and date."
            />
          ) : (
            <List data-testid="legal-agreements-list" position="fill">
              {items.map((record) => (
                <ListItem
                  key={record.id}
                  data-testid={`legal-agreement-${record.id}`}
                 
                >
                  <ListItemIcon>
                    <Tile emphasis="quiet">
                      <Icon name="fileText" scale="sm" />
                    </Tile>
                  </ListItemIcon>
                  <ListItemContent>
                    <Stack dir="col" scale="3xs">
                      <ListItemTitle>
                        <Link
                          href={legalDocumentHref(record.type, {
                            docId: record.legalDocumentId,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {record.orgTypeId ? `${orgTypeLabel(record.orgTypeId)} · ` : ""}
                          {TYPE_LABELS[record.type] ?? record.type} — v{record.version}
                        </Link>
                      </ListItemTitle>
                      <ListItemDescription>{acceptedLabel(record.consentedAt)}</ListItemDescription>
                    </Stack>
                  </ListItemContent>
                </ListItem>
              ))}
            </List>
          )}
        </Content>
      </Card>
    </Stack>
  );
}
