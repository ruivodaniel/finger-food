/**
 * LegalAdminLayout — the authoring surface of the legal documents: the "Legal
 * documents" title band, the catalog (Platform + org types) in the section's own
 * left panel, and the editor in the main column. The URL names the selection
 * (`/:documentType/:orgTypeKey`); the panel comes from the module, the structure
 * is PageLayout's.
 */
import { LegalAdminNav } from "@modules/user-organization-mgmt/web";
import { Outlet, useParams } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import { PageLayout } from "@/components/PageLayout";
import { TitleHeader } from "@/components/TitleHeader";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function LegalAdminLayout() {
  const { documentType, orgTypeKey } = useParams({ strict: false }) as {
    documentType?: string;
    orgTypeKey?: string;
  };
  return (
    <PageLayout
      header={<TitleHeader icon="fileText" title="Legal documents" />}
      sidebar={<LegalAdminNav documentType={documentType} orgTypeKey={orgTypeKey} />}
    >
      {createElement(RouterOutlet)}
    </PageLayout>
  );
}
