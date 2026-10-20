// =============================================================================
// UX PATTERN: Feature Not Available (Plan/Quota)
// =============================================================================
//
// Use Case: Feature exists but is not available in user's plan,
// or user has exceeded their quota.
//
// Decision: Disable + show upgrade/limit message
//
// =============================================================================

import { resolveAvailability, fromBoolean, formatReasons } from "@libs/availability-check";
import { createFromScope } from "@libs/availability-check";

// --- Mock setup ---
const scopedRoles = {
  manage_org: { title: "Manage Organization", coreRole: "manage-orgs" },
};
const fromScope = createFromScope(scopedRoles);

// --- Plan information ---
interface PlanInfo {
  name: "free" | "pro" | "enterprise";
  features: string[];
  limits: {
    projects: number;
    members: number;
  };
}

interface UsageInfo {
  projectCount: number;
  memberCount: number;
}

// --- The pattern: Check feature availability and quotas ---

interface ExportButtonProps {
  memberRoles: string[];
  plan: PlanInfo;
  onExport: () => void;
}

/**
 * Export button that checks if the feature is available in user's plan.
 */
export function ExportButton({ memberRoles, plan, onExport }: ExportButtonProps) {
  const hasExportFeature = plan.features.includes("export");

  const availability = resolveAvailability([
    // Check if feature is in plan
    fromBoolean(hasExportFeature, {
      code: "not_available",
      source: "business_rule",
      params: { 
        feature: "Export to PDF",
        message: "Upgrade to Pro to unlock PDF export",
        upgradePath: "/billing/upgrade",
      },
    }),
    // Check authorization
    fromScope(memberRoles, ["manage_org"]),
  ]);

  if (!availability.available) {
    const isFeatureLimited = availability.reasons.some((r) => r.code === "not_available");

    return (
      <button 
        disabled 
        title={formatReasons(availability.reasons).join(". ")}
        style={{ 
          opacity: 0.5, 
          cursor: "not-allowed",
          position: "relative",
        }}
      >
        Export PDF
        {/* UX: Show upgrade badge for feature limitations */}
        {isFeatureLimited && (
          <span style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            backgroundColor: "#8b5cf6",
            color: "white",
            fontSize: "10px",
            padding: "2px 6px",
            borderRadius: "10px",
          }}>
            PRO
          </span>
        )}
      </button>
    );
  }

  return (
    <button onClick={onExport}>
      Export PDF
    </button>
  );
}

// --- Quota-based availability ---

interface CreateProjectButtonProps {
  memberRoles: string[];
  plan: PlanInfo;
  usage: UsageInfo;
  onCreate: () => void;
}

/**
 * Create Project button that checks quota limits.
 */
export function CreateProjectButton({ memberRoles, plan, usage, onCreate }: CreateProjectButtonProps) {
  const isWithinQuota = usage.projectCount < plan.limits.projects;

  const availability = resolveAvailability([
    // Check quota
    fromBoolean(isWithinQuota, {
      code: "quota_exceeded",
      source: "business_rule",
      params: { 
        limit: `${plan.limits.projects} projects`,
        current: usage.projectCount,
        message: `You've reached your ${plan.name} plan limit of ${plan.limits.projects} projects`,
        upgradePath: "/billing/upgrade",
      },
    }),
    // Check authorization
    fromScope(memberRoles, ["manage_org"]),
  ]);

  if (!availability.available) {
    const isQuotaIssue = availability.reasons.some((r) => r.code === "quota_exceeded");

    return (
      <div>
        <button 
          disabled 
          title={formatReasons(availability.reasons).join(". ")}
          style={{ opacity: 0.5, cursor: "not-allowed" }}
        >
          Create Project
        </button>
        
        {/* UX: Show quota status and upgrade prompt */}
        {isQuotaIssue && (
          <div style={{ 
            marginTop: "8px", 
            padding: "8px", 
            backgroundColor: "#fef3c7",
            borderRadius: "4px",
            fontSize: "12px",
          }}>
            <p>
              <strong>Project limit reached</strong>
            </p>
            <p>
              {usage.projectCount}/{plan.limits.projects} projects used.
              <a href="/billing/upgrade" style={{ marginLeft: "8px", color: "#7c3aed" }}>
                Upgrade to create more →
              </a>
            </p>
          </div>
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

export function exampleFeatureUnavailablePattern() {
  const plans: PlanInfo[] = [
    { 
      name: "free", 
      features: ["basic"], 
      limits: { projects: 3, members: 5 } 
    },
    { 
      name: "pro", 
      features: ["basic", "export", "analytics"], 
      limits: { projects: 50, members: 25 } 
    },
    { 
      name: "enterprise", 
      features: ["basic", "export", "analytics", "sso", "audit"], 
      limits: { projects: 1000, members: 1000 } 
    },
  ];

  const memberRoles = ["manage_org"];

  console.log("=== Feature Availability ===");
  plans.forEach((plan) => {
    const hasExport = plan.features.includes("export");
    const availability = resolveAvailability([
      fromBoolean(hasExport, {
        code: "not_available",
        source: "business_rule",
        params: { feature: "Export" },
      }),
      fromScope(memberRoles, ["manage_org"]),
    ]);

    console.log(`\n${plan.name} plan:`);
    console.log(`  Export available: ${availability.available}`);
    if (!availability.available) {
      console.log(`  Message: ${formatReasons(availability.reasons).join(", ")}`);
    }
  });

  console.log("\n=== Quota Limits ===");
  const usageScenarios = [
    { projectCount: 2, memberCount: 3 },
    { projectCount: 3, memberCount: 5 },  // At limit
    { projectCount: 5, memberCount: 10 }, // Over limit
  ];

  const freePlan = plans[0];
  usageScenarios.forEach((usage) => {
    const isWithinQuota = usage.projectCount < freePlan.limits.projects;
    const availability = resolveAvailability([
      fromBoolean(isWithinQuota, {
        code: "quota_exceeded",
        source: "business_rule",
        params: { limit: `${freePlan.limits.projects} projects` },
      }),
      fromScope(memberRoles, ["manage_org"]),
    ]);

    console.log(`\n${usage.projectCount}/${freePlan.limits.projects} projects:`);
    console.log(`  Can create: ${availability.available}`);
    if (!availability.available) {
      console.log(`  Message: ${formatReasons(availability.reasons).join(", ")}`);
    }
  });
}

// Run example
exampleFeatureUnavailablePattern();

