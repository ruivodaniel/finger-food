// =============================================================================
// UX PATTERN: State Conflict (Entity State Blocks Action)
// =============================================================================
//
// Use Case: Action is blocked because the entity is in a state that
// doesn't allow the action (archived, locked, pending approval, etc.)
//
// Decision: If state conflict → disable + explain the blocking state
//
// =============================================================================

import { resolveAvailability, fromBoolean, formatReasons } from "@libs/availability-check";
import { createFromScope } from "@libs/availability-check";

// --- Mock setup ---
const scopedRoles = {
  manage_org: { title: "Manage Organization", coreRole: "manage-orgs" },
};
const fromScope = createFromScope(scopedRoles);

// --- Entity types ---
interface Organization {
  id: string;
  name: string;
  status: "active" | "archived" | "pending_deletion";
  isLocked: boolean;
}

// --- The pattern: Check entity state before action ---

interface EditOrgButtonProps {
  memberRoles: string[];
  organization: Organization;
  onEdit: () => void;
}

/**
 * Edit button that checks organization state before allowing edits.
 * 
 * Key UX: Different messages for different blocking states.
 */
export function EditOrgButton({ memberRoles, organization, onEdit }: EditOrgButtonProps) {
  const availability = resolveAvailability([
    // Check if archived
    fromBoolean(organization.status !== "archived", {
      code: "conflict",
      source: "business_rule",
      params: { 
        state: "archived",
        message: "Cannot edit an archived organization",
      },
    }),
    // Check if pending deletion
    fromBoolean(organization.status !== "pending_deletion", {
      code: "conflict",
      source: "business_rule",
      params: { 
        state: "pending_deletion",
        message: "Organization is scheduled for deletion",
      },
    }),
    // Check if locked
    fromBoolean(!organization.isLocked, {
      code: "conflict",
      source: "business_rule",
      params: { 
        state: "locked",
        message: "Organization is locked by an administrator",
      },
    }),
    // Check authorization
    fromScope(memberRoles, ["manage_org"]),
  ]);

  if (!availability.available) {
    // Determine the primary blocking reason for styling
    const isStateConflict = availability.reasons.some((r) => r.code === "conflict");

    return (
      <button 
        disabled 
        title={formatReasons(availability.reasons).join(". ")}
        style={{ 
          opacity: 0.5, 
          cursor: "not-allowed",
          // Visual distinction for state conflicts vs permission issues
          backgroundColor: isStateConflict ? "#fef2f2" : "#f3f4f6",
          borderColor: isStateConflict ? "#fca5a5" : "#d1d5db",
        }}
      >
        Edit Organization
      </button>
    );
  }

  return (
    <button onClick={onEdit}>
      Edit Organization
    </button>
  );
}

// --- Example scenarios ---

export function exampleStateConflictPattern() {
  const organizations: Organization[] = [
    { id: "1", name: "Active Org", status: "active", isLocked: false },
    { id: "2", name: "Archived Org", status: "archived", isLocked: false },
    { id: "3", name: "Pending Deletion", status: "pending_deletion", isLocked: false },
    { id: "4", name: "Locked Org", status: "active", isLocked: true },
    { id: "5", name: "Archived + Locked", status: "archived", isLocked: true },
  ];

  const memberRoles = ["manage_org"];

  organizations.forEach((org) => {
    const availability = resolveAvailability([
      fromBoolean(org.status !== "archived", {
        code: "conflict",
        source: "business_rule",
        params: { state: "archived", message: "Cannot edit archived organization" },
      }),
      fromBoolean(org.status !== "pending_deletion", {
        code: "conflict",
        source: "business_rule",
        params: { state: "pending_deletion", message: "Organization scheduled for deletion" },
      }),
      fromBoolean(!org.isLocked, {
        code: "conflict",
        source: "business_rule",
        params: { state: "locked", message: "Organization is locked" },
      }),
      fromScope(memberRoles, ["manage_org"]),
    ]);

    console.log(`\n${org.name}:`);
    console.log(`  Status: ${org.status}, Locked: ${org.isLocked}`);
    console.log(`  Available: ${availability.available}`);
    
    if (!availability.available) {
      console.log(`  Blockers: ${formatReasons(availability.reasons).join(" | ")}`);
    }
  });
}

// --- Delete button with confirmation awareness ---

interface DeleteOrgButtonProps {
  memberRoles: string[];
  organization: Organization;
  onDelete: () => void;
}

/**
 * Delete button with additional state checks.
 * Shows different messaging based on current state.
 */
export function DeleteOrgButton({ memberRoles, organization, onDelete }: DeleteOrgButtonProps) {
  const availability = resolveAvailability([
    // Can't delete if already pending deletion
    fromBoolean(organization.status !== "pending_deletion", {
      code: "conflict",
      source: "business_rule",
      params: { 
        state: "pending_deletion",
        message: "Already scheduled for deletion",
      },
    }),
    // Can't delete if locked
    fromBoolean(!organization.isLocked, {
      code: "conflict",
      source: "business_rule",
      params: { 
        state: "locked",
        message: "Unlock the organization first",
      },
    }),
    // Check authorization
    fromScope(memberRoles, ["manage_org"]),
  ]);

  const tooltipText = availability.available 
    ? "Delete this organization" 
    : formatReasons(availability.reasons).join(". ");

  return (
    <button
      onClick={availability.available ? onDelete : undefined}
      disabled={!availability.available}
      title={tooltipText}
      style={{ 
        opacity: availability.available ? 1 : 0.5,
        backgroundColor: availability.available ? "#ef4444" : "#9ca3af",
        color: "white",
      }}
    >
      Delete Organization
    </button>
  );
}

// Run example
exampleStateConflictPattern();

