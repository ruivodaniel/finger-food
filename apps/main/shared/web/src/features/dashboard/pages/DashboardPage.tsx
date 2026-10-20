/**
 * DashboardPage — the signed-in home ("/dashboard"): a welcome and, later,
 * whatever the product wants front and center. App-owned on purpose — the
 * module contributes account/org pages but never decides what home is.
 * Pending obligations never render here: the gate guard bounces blocked
 * callers to /resolve before this page mounts.
 */

import * as React from "react";
import { useSession } from "@modules/user-organization-mgmt/web";

export function DashboardPage(): React.ReactElement | null {
  const { data: sessionData } = useSession();
  const name = sessionData?.user?.profile?.name?.trim();

  return (
    <div
      data-testid="dashboard-page"
      layout="col-section"
      style={{ maxWidth: 560, margin: "0 auto", gap: 16 }}
    >
      <h2 element="type--heading3">
        {name ? `Welcome, ${name}` : "Welcome"}
      </h2>
      <p element="type--body-small">
        You're all caught up — nothing needs your attention.
      </p>
    </div>
  );
}
