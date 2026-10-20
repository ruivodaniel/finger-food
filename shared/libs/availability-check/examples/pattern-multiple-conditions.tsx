// =============================================================================
// UX PATTERN: Multiple Conditions Combined
// =============================================================================
//
// Use Case: Complex actions that require multiple conditions to be satisfied
// (authorization + loading + validation + entity state).
//
// Decision: Collect ALL reasons and show comprehensive feedback
//
// =============================================================================

import { resolveAvailability, fromBoolean, fromZod, formatReasons } from "@libs/availability-check";
import { createFromScope } from "@libs/availability-check";
import type { ZodErrorLike } from "@libs/availability-check";

// --- Mock setup ---
const scopedRoles = {
  manage_org: { title: "Manage Organization", coreRole: "manage-orgs" },
};
const fromScope = createFromScope(scopedRoles);

// --- Complex form state ---
interface FormState {
  memberRoles: string[];
  activeOrgId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  validationErrors: ZodErrorLike | null;
  entity: {
    id: string;
    status: "active" | "archived";
  } | null;
}

// --- The pattern: Combine all conditions ---

/**
 * Resolve availability for a complex form submit action.
 * 
 * This is the "full picture" approach: check everything and report all issues.
 */
function resolveFormSubmitAvailability(state: FormState) {
  return resolveAvailability([
    // 1. Data must be loaded
    fromBoolean(!state.isLoading, {
      code: "in_progress",
      source: "ui_state",
      params: { operation: "loading" },
    }),

    // 2. Not currently saving
    fromBoolean(!state.isSaving, {
      code: "in_progress",
      source: "ui_state",
      params: { operation: "saving" },
    }),

    // 3. Organization must be selected
    fromBoolean(!!state.activeOrgId, {
      code: "precondition_missing",
      source: "ui_state",
      params: { missing: "organization", message: "Select an organization" },
    }),

    // 4. Entity must exist (not null)
    fromBoolean(!!state.entity, {
      code: "not_found",
      source: "api",
      params: { message: "Entity not found" },
    }),

    // 5. Entity must not be archived
    fromBoolean(state.entity?.status !== "archived", {
      code: "conflict",
      source: "business_rule",
      params: { state: "archived", message: "Cannot modify archived entity" },
    }),

    // 6. Form must be valid
    fromZod(state.validationErrors),

    // 7. User must have permission
    fromScope(state.memberRoles, ["manage_org"]),
  ]);
}

// --- Submit button component ---

interface SubmitFormButtonProps {
  formState: FormState;
  onSubmit: () => void;
}

/**
 * Submit button that shows all blocking reasons.
 * 
 * Key UX: User sees everything that needs to be fixed, not just the first issue.
 */
export function SubmitFormButton({ formState, onSubmit }: SubmitFormButtonProps) {
  const availability = resolveFormSubmitAvailability(formState);

  // Categorize reasons for better UX
  const categories = {
    loading: availability.reasons.filter((r) => r.code === "in_progress"),
    validation: availability.reasons.filter((r) => r.code === "invalid_input"),
    authorization: availability.reasons.filter((r) => r.code === "not_authorized"),
    preconditions: availability.reasons.filter((r) => r.code === "precondition_missing"),
    conflicts: availability.reasons.filter((r) => r.code === "conflict"),
    other: availability.reasons.filter((r) => 
      !["in_progress", "invalid_input", "not_authorized", "precondition_missing", "conflict"].includes(r.code)
    ),
  };

  // Determine button label based on state
  const getButtonLabel = () => {
    if (categories.loading.some((r) => r.params?.operation === "saving")) {
      return "Saving...";
    }
    if (categories.loading.some((r) => r.params?.operation === "loading")) {
      return "Loading...";
    }
    return "Save Changes";
  };

  if (!availability.available) {
    return (
      <div>
        <button 
          disabled 
          style={{ opacity: 0.5, cursor: "not-allowed" }}
        >
          {getButtonLabel()}
        </button>

        {/* UX: Show categorized feedback */}
        <div style={{ marginTop: "8px", fontSize: "12px" }}>
          {categories.validation.length > 0 && (
            <div style={{ color: "#dc2626" }}>
              <strong>Validation errors:</strong>
              <ul>
                {categories.validation.map((r, i) => (
                  <li key={i}>{r.params?.field}: {r.params?.message}</li>
                ))}
              </ul>
            </div>
          )}

          {categories.authorization.length > 0 && (
            <div style={{ color: "#7c3aed" }}>
              {formatReasons(categories.authorization).join(". ")}
            </div>
          )}

          {categories.preconditions.length > 0 && (
            <div style={{ color: "#2563eb" }}>
              {formatReasons(categories.preconditions).join(". ")}
            </div>
          )}

          {categories.conflicts.length > 0 && (
            <div style={{ color: "#ea580c" }}>
              {formatReasons(categories.conflicts).join(". ")}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <button onClick={onSubmit}>
      {getButtonLabel()}
    </button>
  );
}

// --- Example scenarios ---

export function exampleMultipleConditionsPattern() {
  const scenarios: Array<{ name: string; state: FormState }> = [
    {
      name: "All conditions failing",
      state: {
        memberRoles: [],
        activeOrgId: null,
        isLoading: true,
        isSaving: false,
        validationErrors: {
          issues: [
            { path: ["email"], message: "Invalid email", code: "invalid_string" },
          ],
        },
        entity: { id: "1", status: "archived" },
      },
    },
    {
      name: "Only validation failing",
      state: {
        memberRoles: ["manage_org"],
        activeOrgId: "org_123",
        isLoading: false,
        isSaving: false,
        validationErrors: {
          issues: [
            { path: ["name"], message: "Required", code: "too_small" },
          ],
        },
        entity: { id: "1", status: "active" },
      },
    },
    {
      name: "Authorization + Conflict",
      state: {
        memberRoles: [],
        activeOrgId: "org_123",
        isLoading: false,
        isSaving: false,
        validationErrors: null,
        entity: { id: "1", status: "archived" },
      },
    },
    {
      name: "All conditions passing",
      state: {
        memberRoles: ["manage_org"],
        activeOrgId: "org_123",
        isLoading: false,
        isSaving: false,
        validationErrors: null,
        entity: { id: "1", status: "active" },
      },
    },
  ];

  scenarios.forEach((scenario) => {
    const availability = resolveFormSubmitAvailability(scenario.state);

    console.log(`\n${scenario.name}:`);
    console.log(`  Available: ${availability.available}`);
    console.log(`  Reason count: ${availability.reasons.length}`);
    
    if (!availability.available) {
      console.log(`  All reasons:`);
      formatReasons(availability.reasons).forEach((msg) => {
        console.log(`    - ${msg}`);
      });
    }
  });
}

// Run example
exampleMultipleConditionsPattern();

