// =============================================================================
// UX PATTERN: Disable Button with Tooltip Explanation
// =============================================================================
//
// Use Case: Action buttons that should remain visible but disabled when
// user lacks permission. User sees WHY they can't act.
//
// Decision: If not authorized → show button disabled + tooltip with reason
//
// =============================================================================

import { resolveAvailability, formatReasons } from "@libs/availability-check";
import { createFromScope } from "@libs/availability-check";

// --- Mock setup ---
const scopedRoles = {
  view_org: { title: "View Organization", coreRole: "view-orgs" },
  manage_org: { title: "Manage Organization", coreRole: "manage-orgs", implies: ["view_org"] },
};
const fromScope = createFromScope(scopedRoles);

// --- The pattern: Button with disabled state and tooltip ---

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  memberRoles: string[];
  requiredRoles: string[];
}

/**
 * Action button that shows disabled state with tooltip when user lacks permission.
 * 
 * Key UX principle: Button is VISIBLE but DISABLED with explanation.
 * User knows the feature exists, understands why they can't use it.
 */
export function ActionButton({ label, onClick, memberRoles, requiredRoles }: ActionButtonProps) {
  const availability = resolveAvailability([
    fromScope(memberRoles, requiredRoles),
  ]);

  if (!availability.available) {
    // UX Decision: Disable + show tooltip
    const tooltipText = formatReasons(availability.reasons).join(". ");

    return (
      <button
        disabled
        title={tooltipText}
        style={{ opacity: 0.5, cursor: "not-allowed" }}
      >
        {label}
      </button>
    );
  }

  return (
    <button onClick={onClick}>
      {label}
    </button>
  );
}

// --- Example with multiple scenarios ---

export function exampleDisablePattern() {
  const scenarios = [
    {
      name: "User with view_org trying to edit",
      memberRoles: ["view_org"],
      requiredRoles: ["manage_org"],
    },
    {
      name: "User with manage_org trying to edit",
      memberRoles: ["manage_org"],
      requiredRoles: ["manage_org"],
    },
    {
      name: "User with no roles trying to edit",
      memberRoles: [],
      requiredRoles: ["manage_org"],
    },
  ];

  scenarios.forEach((scenario) => {
    const availability = resolveAvailability([
      fromScope(scenario.memberRoles, scenario.requiredRoles),
    ]);

    console.log(`\n${scenario.name}:`);
    console.log(`  Available: ${availability.available}`);
    
    if (!availability.available) {
      console.log(`  Tooltip: "${formatReasons(availability.reasons).join(". ")}"`);
      console.log(`  Render: <button disabled title="...">Edit</button>`);
    } else {
      console.log(`  Render: <button>Edit</button>`);
    }
  });
}

// --- React component with icon and styling ---

interface EditButtonProps {
  memberRoles: string[];
  onEdit: () => void;
}

export function EditButton({ memberRoles, onEdit }: EditButtonProps) {
  const availability = resolveAvailability([
    fromScope(memberRoles, ["manage_org"]),
  ]);

  const buttonStyle = {
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    cursor: availability.available ? "pointer" : "not-allowed",
    opacity: availability.available ? 1 : 0.5,
    backgroundColor: availability.available ? "#3b82f6" : "#9ca3af",
    color: "white",
  };

  const tooltipText = availability.available 
    ? undefined 
    : formatReasons(availability.reasons).join(". ");

  return (
    <button
      onClick={availability.available ? onEdit : undefined}
      disabled={!availability.available}
      title={tooltipText}
      style={buttonStyle}
    >
      Edit Organization
    </button>
  );
}

// Run example
exampleDisablePattern();

