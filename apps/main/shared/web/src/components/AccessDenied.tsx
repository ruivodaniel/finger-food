/**
 * Access Denied Component (403)
 *
 * Self-contained app component. The module no longer exports these — it
 * renders its own internal AccessDenied where needed (inside the guard).
 * This file exists for the legacy migration reference routes.
 */

import { Button, Icon } from "@libs/web-components";

export interface AccessDeniedProps {
  title?: string;
  message?: string;
  showSwitchOrg?: boolean;
  showGoBack?: boolean;
  showDashboard?: boolean;
  switchOrgPath?: string;
  dashboardPath?: string;
  onNavigate?: (path: string) => void;
}

export function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to access this page with your current organization.",
  showSwitchOrg = true,
  showGoBack = true,
  showDashboard = true,
  switchOrgPath = "/settings/account",
  dashboardPath = "/dashboard",
  onNavigate,
}: AccessDeniedProps) {
  const navigate = onNavigate ?? ((path: string) => { window.location.href = path; });

  return (
    <div className="flex h-full flex-col items-center justify-center" data-testid="access-denied">
      <div className="flex flex-col items-center text-center">
        <Icon name="accessDenied" size="xl" />
        <h1 element="type--heading2">{title}</h1>
        <p element="type--body-small" emphasis="quiet">{message}</p>
      </div>

      <div className="flex flex-wrap justify-center">
        {showGoBack && (
          <Button emphasis="secondary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        )}
        {showDashboard && (
          <Button emphasis="secondary" onClick={() => navigate(dashboardPath)}>
            Go to Dashboard
          </Button>
        )}
        {showSwitchOrg && (
          <Button onClick={() => navigate(switchOrgPath)}>
            Switch Organization
          </Button>
        )}
      </div>

      <p element="type--body-extra-small" emphasis="quiet">
        If you believe this is an error, contact your organization administrator.
      </p>
    </div>
  );
}

/** Custom error class for 403 errors */
export class ForbiddenError extends Error {
  constructor(message = "Access denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}
