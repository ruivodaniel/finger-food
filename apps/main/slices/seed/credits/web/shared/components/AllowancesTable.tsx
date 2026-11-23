/**
 * AllowancesTable — what the organization lets each member spend: the amount
 * per period, whether unspent credits add up or reset, what they can be spent
 * on. The first row is the rule for every member without one of their own. A
 * member with no rule at all shares the organization's credits; spent and left
 * come from the ledger, and purchases never count.
 */

import * as React from "react";
import { Badge, Button, Card, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { PERIOD_LABELS, UNSPENT_LABELS, credits, servicesLabel } from "../helpers/format";
import type { MemberAllowanceRow } from "../hooks/use-allowances";

export interface AllowancesTableProps {
  rows: MemberAllowanceRow[];
  onEdit: (row: MemberAllowanceRow) => void;
  /** names a catalog service */
  serviceName: (key: string) => string;
}

export function AllowancesTable({ rows, onEdit, serviceName }: AllowancesTableProps): React.ReactElement {
  return (
    <Card data-testid="allowances-card">
      <CardHeader>
        <Stack dir="col" scale="3xs">
          <h3 element="type--heading4">Member allocations</h3>
          <span element="type--body-small" emphasis="quiet">
            What each member may spend. When a member's amount is used up they stop, whatever else the organization holds. Without a rule a member shares the organization's credits. Purchases never count.
          </span>
        </Stack>
      </CardHeader>
      <CardContent>
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Unspent</TableHead>
              <TableHead>Spend on</TableHead>
              <TableHead className="text-right">Spent</TableHead>
              <TableHead className="text-right">Left</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const a = row.allowance;
              const everyone = row.userId == null;
              const key = row.userId ?? "everyone";
              return (
                <TableRow key={key} data-testid={`allowance-${key}`}>
                  <TableCell>
                    <Stack dir="col" scale="3xs">
                      <span>{row.name}</span>
                      {(row.role || row.followsEveryone) && (
                        <span element="type--body-small" emphasis="quiet">
                          {[row.role, row.followsEveryone ? "follows all members" : ""].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {a ? (
                      <Stack dir="row" scale="xs" align="center" wrap>
                        <span>
                          {credits(a.credits)} {PERIOD_LABELS[a.period]}
                        </span>
                        {a.createsCredits && <Badge status="info">created</Badge>}
                      </Stack>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{a ? UNSPENT_LABELS[a.unspent] : "—"}</TableCell>
                  <TableCell>{a ? servicesLabel(a.services, serviceName) : "—"}</TableCell>
                  <TableCell className="text-right">{a && !everyone && !(row.followsEveryone && a.userId == null) ? credits(a.spent) : "—"}</TableCell>
                  <TableCell className="text-right">{a && !everyone && !(row.followsEveryone && a.userId == null) ? credits(a.remaining) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button emphasis="quiet" scale="sm" onClick={() => onEdit(row)} data-testid={`set-allowance-${key}`}>
                      {a && !row.followsEveryone ? "Change" : "Set a rule"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
