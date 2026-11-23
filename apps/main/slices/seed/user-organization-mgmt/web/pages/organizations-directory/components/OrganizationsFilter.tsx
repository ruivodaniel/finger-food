/**
 * OrganizationsFilter — the directory's filter bar: status tabs, name
 * search, and an org-type select. Pure controls; the page owns the state.
 *
 * A wrapping row Stack: the Tabs, the search Input, the type InputSelect in
 * a fixed-width cell. No inline styles.
 */

import * as React from "react";
import {
  Input,
  InputSelect,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";

export interface OrganizationsFilterValue {
  search: string;
  type: string | null;
  status: "all" | "active" | "inactive";
}

export interface OrganizationsFilterProps {
  value: OrganizationsFilterValue;
  /** The org types the select offers ({ id, label }). */
  types: Array<{ id: string; label: string }>;
  onChange: (value: OrganizationsFilterValue) => void;
  /** what sits at the end of the fields row (the page's action button). */
  actions?: React.ReactNode;
}

export function OrganizationsFilter({
  value,
  types,
  onChange,
  actions,
}: OrganizationsFilterProps): React.ReactElement {
  return (
    <Stack dir="col" scale="md" data-testid="organizations-filter">
      <Stack dir="row">
      <Tabs
        value={value.status}
        onValueChange={(status) =>
          onChange({ ...value, status: status as OrganizationsFilterValue["status"] })
        }
      >
        <TabsList>
          <TabsTrigger value="all" data-testid="org-filter-all">
            All
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="org-filter-active">
            Active
          </TabsTrigger>
          <TabsTrigger value="inactive" data-testid="org-filter-inactive">
            Inactive
          </TabsTrigger>
        </TabsList>
      </Tabs>
      </Stack>
      <Stack dir="row" align="center" justify="between" scale="md">
      <Stack dir="row" align="center" scale="md">
      <Input
        data-testid="org-filter-search"
        value={value.search}
        placeholder="Search by name"
        onChange={(search) => onChange({ ...value, search })}
      />
      <InputSelect
          data-testid="org-filter-type"
          aria-label="Type"
          placeholder="Type"
          clearable={false}
          value={value.type ?? "all"}
          onChange={(type) =>
            onChange({ ...value, type: !type || type === "all" ? null : type })
          }
          options={[
            { value: "all", label: "All types" },
            ...types.map((t) => ({ value: t.id, label: t.label })),
          ]}
        />
      </Stack>
      {actions}
      </Stack>
    </Stack>
  );
}
