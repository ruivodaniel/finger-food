/**
 * IdentifiersList — the caller's sign-in identifiers as rows: an icon Tile ·
 * the address · a Verified / Not verified Badge · Remove. Removing
 * invalidates session+me+gate, so the gate and the list update in place.
 * Shared by the account settings page and IdentifierResolution (/resolve).
 */

import * as React from "react";
import { Badge, Button, Icon, List, ListItem, ListItemAction, ListItemContent, ListItemIcon, ListItemTitle, Tile, Alert, AlertDescription } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { authenticationService } from "../../services/application/authentication.service";
import { profileService } from "../../services/application/profile.service";
import { isApiError } from "../helpers/api-error";

export function IdentifiersList(): React.ReactElement | null {
  const invalidateSession = authenticationService.refreshSession;
  const { data: sessionData } = useQuery(authenticationService.getSession());
  const [error, setError] = React.useState<string | null>(null);

  const { data: me } = useQuery({
    ...profileService.getProfile(),
    enabled: !!sessionData?.session,
  });

  if (!sessionData?.session) return null;

  const remove = async (type: string, value: string) => {
    setError(null);
    try {
      await profileService.removeIdentifier({ type: type as "email" | "phone", value });
      await invalidateSession();
    } catch (e) {
      setError(isApiError(e) ? e.message : "something went wrong");
    }
  };

  return (
    <Stack dir="col" scale="md">
      <List data-testid="identifiers-list" position="fill">
        {(me?.identifiers ?? []).map((identifier) => (
          <ListItem
            key={`${identifier.type}:${identifier.value}`}
            data-testid={`identifier-${identifier.value}`}
            status={identifier.verified ? undefined : "warning"}
           
          >
            <ListItemIcon>
              <Tile emphasis="quiet">
                <Icon name={identifier.type === "phone" ? "phone" : "mail"} scale="sm" />
              </Tile>
            </ListItemIcon>
            <ListItemContent>
              <Stack dir="row" align="center" scale="sm" wrap>
                <ListItemTitle>{identifier.value}</ListItemTitle>
                <Badge
                  data-testid={`identifier-${identifier.value}-status`}
                  emphasis="quiet"
                  status={identifier.verified ? "success" : "warning"}
                  scale="xs"
                >
                  {identifier.verified ? "Verified" : "Not verified"}
                </Badge>
              </Stack>
            </ListItemContent>
            <ListItemAction>
              <Button
                data-testid={`identifier-${identifier.value}-remove`}
                emphasis="secondary"
                status="destructive"
                scale="sm"
                onClick={() => void remove(identifier.type, identifier.value)}
              >
                Remove
              </Button>
            </ListItemAction>
          </ListItem>
        ))}
      </List>
      {error && (
        <Alert status="error" data-testid="identifiers-page-error"><AlertDescription>{error}</AlertDescription></Alert>
      )}
    </Stack>
  );
}
