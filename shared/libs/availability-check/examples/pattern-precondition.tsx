// =============================================================================
// UX PATTERN: Precondition Missing
// =============================================================================
//
// Use Case: Action requires a prerequisite step (e.g., select organization)
// before it can be performed.
//
// Decision: If precondition missing → disable + explain what's needed
//
// =============================================================================

import { resolveAvailability, fromBoolean, formatReasons } from "@libs/availability-check";
import { createFromScope } from "@libs/availability-check";

// --- Mock setup ---
const scopedRoles = {
  manage_org: { title: "Manage Organization", coreRole: "manage-orgs" },
};
const fromScope = createFromScope(scopedRoles);

// --- The pattern: Check preconditions before action ---

interface CreateProjectButtonProps {
  memberRoles: string[];
  activeOrgId: string | null;
  onCreate: () => void;
}

/**
 * Create Project button that requires an organization to be selected.
 * 
 * Key UX: Guide user to the prerequisite step, don't just say "unavailable".
 */
export function CreateProjectButton({ memberRoles, activeOrgId, onCreate }: CreateProjectButtonProps) {
  const availability = resolveAvailability([
    // Precondition: Organization must be selected
    fromBoolean(!!activeOrgId, {
      code: "precondition_missing",
      source: "ui_state",
      params: { 
        missing: "organization",
        message: "Please select an organization first",
      },
    }),
    // Authorization check
    fromScope(memberRoles, ["manage_org"]),
  ]);

  if (!availability.available) {
    const isPreconditionIssue = availability.reasons.some(
      (r) => r.code === "precondition_missing"
    );

    return (
      <div>
        <button 
          disabled 
          title={formatReasons(availability.reasons).join(". ")}
          style={{ opacity: 0.5, cursor: "not-allowed" }}
        >
          Create Project
        </button>
        
        {/* UX Enhancement: Show inline guidance for preconditions */}
        {isPreconditionIssue && (
          <p style={{ color: "#6b7280", fontSize: "12px", marginTop: "4px" }}>
            Select an organization from the sidebar to create a project.
          </p>
        )}
      </div>
    );
  }

  return (
    <button onClick={onCreate}>
      Create Project
    </button>
  );
}

// --- Example scenarios ---

export function examplePreconditionPattern() {
  const scenarios = [
    {
      name: "No organization selected",
      memberRoles: ["manage_org"],
      activeOrgId: null,
    },
    {
      name: "Organization selected but no permission",
      memberRoles: [],
      activeOrgId: "org_123",
    },
    {
      name: "Both missing (no org + no permission)",
      memberRoles: [],
      activeOrgId: null,
    },
    {
      name: "Ready (org selected + permission)",
      memberRoles: ["manage_org"],
      activeOrgId: "org_123",
    },
  ];

  scenarios.forEach((scenario) => {
    const availability = resolveAvailability([
      fromBoolean(!!scenario.activeOrgId, {
        code: "precondition_missing",
        source: "ui_state",
        params: { 
          missing: "organization",
          message: "Please select an organization first",
        },
      }),
      fromScope(scenario.memberRoles, ["manage_org"]),
    ]);

    console.log(`\n${scenario.name}:`);
    console.log(`  Available: ${availability.available}`);
    console.log(`  Reasons: ${formatReasons(availability.reasons).join(", ") || "(none)"}`);
    
    // Note: All reasons are collected, user sees complete picture
    if (availability.reasons.length > 1) {
      console.log(`  (Multiple blockers - user sees all of them)`);
    }
  });
}

// --- Another example: Setup wizard progress ---

interface FeatureButtonProps {
  memberRoles: string[];
  hasConnectedIntegration: boolean;
  hasCompletedOnboarding: boolean;
  onActivate: () => void;
}

/**
 * Feature button that requires multiple setup steps to be completed.
 */
export function FeatureButton({ 
  memberRoles, 
  hasConnectedIntegration, 
  hasCompletedOnboarding,
  onActivate,
}: FeatureButtonProps) {
  const availability = resolveAvailability([
    fromBoolean(hasCompletedOnboarding, {
      code: "precondition_missing",
      source: "ui_state",
      params: { 
        missing: "onboarding",
        message: "Complete the onboarding wizard first",
      },
    }),
    fromBoolean(hasConnectedIntegration, {
      code: "precondition_missing",
      source: "ui_state",
      params: { 
        missing: "integration",
        message: "Connect your integration in Settings",
      },
    }),
    fromScope(memberRoles, ["manage_org"]),
  ]);

  const tooltipText = availability.available 
    ? undefined 
    : formatReasons(availability.reasons).join(". ");

  return (
    <button
      onClick={availability.available ? onActivate : undefined}
      disabled={!availability.available}
      title={tooltipText}
      style={{ opacity: availability.available ? 1 : 0.5 }}
    >
      Activate Feature
    </button>
  );
}

// Run example
examplePreconditionPattern();

