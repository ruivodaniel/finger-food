/**
 * IdentifiersList — the caller's sign-in identifiers as rows: an icon Tile ·
 * the address · a Verified / Not verified Badge · Remove. Removing
 * invalidates session+me+gate, so the gate and the list update in place.
 * Shared by the account settings page and IdentifierResolution (/resolve).
 */

import * as React from "react";
import {
  Badge,
  Button,
  Icon,
  List,
  ListItem,
  ListItemAction,
  ListItemContent,
  ListItemIcon,
  ListItemTitle,
  Tile,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession, useInvalidateSession } from "../../hooks/use-session";
import { queryKeys } from "../../lib/query-keys";
import { ApiError } from "../../lib/api-client";
import { StatusAlert } from "../StatusAlert";

export function IdentifiersList(): React.ReactElement | null {
  const { client } = useUserOrgMgmtContext();
  const invalidateSession = useInvalidateSession();
  const { data: sessionData } = useSession();
  const [error, setError] = React.useState<string | null>(null);

  const { data: me } = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => client.getMe(),
    enabled: !!sessionData?.session,
  });

  if (!sessionData?.session) return null;

  const remove = async (type: string, value: string) => {
    setError(null);
    try {
      await client.removeIdentifier({ type: type as "email" | "phone", value });
      await invalidateSession();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "something went wrong");
    }
  };

  return (
    <Stack dir="col" gap={12}>
      <List data-testid="identifiers-list" position="fill">
        {(me?.identifiers ?? []).map((identifier) => (
          <ListItem
            key={`${identifier.type}:${identifier.value}`}
            data-testid={`identifier-${identifier.value}`}
            status={identifier.verified ? undefined : "warning"}
           
          >
            <ListItemIcon>
              <Tile emphasis="quiet">
                <Icon name={identifier.type === "phone" ? "phone" : "mail"} size="sm" />
              </Tile>
            </ListItemIcon>
            <ListItemContent>
              <Stack dir="row" align="center" gap={8} wrap>
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
        <StatusAlert status="error" testId="identifiers-page-error">{error}</StatusAlert>
      )}
    </Stack>
  );
}
