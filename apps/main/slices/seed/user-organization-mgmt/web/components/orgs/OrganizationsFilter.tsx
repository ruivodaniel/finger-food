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
}

export function OrganizationsFilter({
  value,
  types,
  onChange,
}: OrganizationsFilterProps): React.ReactElement {
  return (
    <Stack dir="row" align="center" gap={12} wrap data-testid="organizations-filter">
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
      <Input
        data-testid="org-filter-search"
        value={value.search}
        placeholder="Search by name"
        onChange={(e) => onChange({ ...value, search: e.target.value })}
        position="w-md"
      />
      <Stack dir="col" size="fixed" className="w-48">
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
    </Stack>
  );
}
