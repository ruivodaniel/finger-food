// =============================================================================
// UX PATTERN: Loading State
// =============================================================================
//
// Use Case: Button or action that should be disabled while data is loading
// or an operation is in progress.
//
// Decision: If loading/saving → show loading indicator + disabled button
//
// =============================================================================

import { resolveAvailability, fromBoolean, formatReasons } from "@libs/availability-check";
import { createFromScope } from "@libs/availability-check";

// --- Mock setup ---
const scopedRoles = {
  manage_org: { title: "Manage Organization", coreRole: "manage-orgs" },
};
const fromScope = createFromScope(scopedRoles);

// --- The pattern: Handle loading states ---

interface SubmitButtonProps {
  memberRoles: string[];
  isLoading: boolean;
  isSaving: boolean;
  onSubmit: () => void;
}

/**
 * Submit button that handles both permission and loading states.
 * 
 * Shows different feedback based on what's blocking the action:
 * - Saving: "Saving..." text with spinner
 * - Loading data: "Loading..." with skeleton
 * - Not authorized: Disabled with tooltip
 */
export function SubmitButton({ memberRoles, isLoading, isSaving, onSubmit }: SubmitButtonProps) {
  const availability = resolveAvailability([
    // Check loading state first (data not ready)
    fromBoolean(!isLoading, {
      code: "in_progress",
      source: "ui_state",
      params: { operation: "loading", target: "data" },
    }),
    // Check saving state
    fromBoolean(!isSaving, {
      code: "in_progress",
      source: "ui_state",
      params: { operation: "saving" },
    }),
    // Check authorization
    fromScope(memberRoles, ["manage_org"]),
  ]);

  // Determine button state based on reasons
  const isSavingNow = availability.reasons.some(
    (r) => r.code === "in_progress" && r.params?.operation === "saving"
  );
  const isLoadingNow = availability.reasons.some(
    (r) => r.code === "in_progress" && r.params?.operation === "loading"
  );

  // UX Decision: Different rendering based on WHY it's unavailable
  if (isSavingNow) {
    return (
      <button disabled style={{ opacity: 0.7 }}>
        Saving...
      </button>
    );
  }

  if (isLoadingNow) {
    return (
      <button disabled style={{ opacity: 0.5 }}>
        Loading...
      </button>
    );
  }

  if (!availability.available) {
    // Not authorized
    return (
      <button 
        disabled 
        title={formatReasons(availability.reasons).join(". ")}
        style={{ opacity: 0.5, cursor: "not-allowed" }}
      >
        Submit
      </button>
    );
  }

  return (
    <button onClick={onSubmit}>
      Submit
    </button>
  );
}

// --- Example scenarios ---

export function exampleLoadingPattern() {
  const scenarios = [
    {
      name: "Loading data",
      memberRoles: ["manage_org"],
      isLoading: true,
      isSaving: false,
    },
    {
      name: "Saving in progress",
      memberRoles: ["manage_org"],
      isLoading: false,
      isSaving: true,
    },
    {
      name: "Not authorized (data ready)",
      memberRoles: [],
      isLoading: false,
      isSaving: false,
    },
    {
      name: "Ready to submit",
      memberRoles: ["manage_org"],
      isLoading: false,
      isSaving: false,
    },
  ];

  scenarios.forEach((scenario) => {
    const availability = resolveAvailability([
      fromBoolean(!scenario.isLoading, {
        code: "in_progress",
        source: "ui_state",
        params: { operation: "loading" },
      }),
      fromBoolean(!scenario.isSaving, {
        code: "in_progress",
        source: "ui_state",
        params: { operation: "saving" },
      }),
      fromScope(scenario.memberRoles, ["manage_org"]),
    ]);

    console.log(`\n${scenario.name}:`);
    console.log(`  Available: ${availability.available}`);
    console.log(`  Reasons: ${availability.reasons.map((r) => r.code).join(", ") || "(none)"}`);
    
    if (scenario.isSaving) {
      console.log(`  Render: <button disabled>Saving...</button>`);
    } else if (scenario.isLoading) {
      console.log(`  Render: <button disabled>Loading...</button>`);
    } else if (!availability.available) {
      console.log(`  Render: <button disabled title="...">Submit</button>`);
    } else {
      console.log(`  Render: <button>Submit</button>`);
    }
  });
}

// Run example
exampleLoadingPattern();

