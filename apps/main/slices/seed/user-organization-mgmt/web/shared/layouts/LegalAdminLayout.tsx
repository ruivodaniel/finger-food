/**
 * LegalAdminLayout — the slice layout of the legal documents' authoring: the "Legal documents" title band, the catalog
 * (platform + org types) in the page left sidebar, the editor in the main container. The URL names the selection
 * (`/:documentType/:orgTypeKey`).
 */
import { Outlet, useParams } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import { DoubleSidebarLayout } from "@libs/web-layouts";
import { TitleHeader } from "@modules/shared/web";
import { LegalAdminNav } from "../components/LegalAdminNav";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function LegalAdminLayout() {
  const { documentType, orgTypeKey } = useParams({ strict: false }) as { documentType?: string; orgTypeKey?: string };
  return (
    <DoubleSidebarLayout
      scale="md"
      pageHeaderContent={<TitleHeader icon="fileText" title="Legal documents" />}
      pageLeftSidebarContent={<LegalAdminNav documentType={documentType} orgTypeKey={orgTypeKey} />}
      mainContainerContent={createElement(RouterOutlet)}
    />
  );
}
