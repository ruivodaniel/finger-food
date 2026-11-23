/// <reference path="../../react-overrides.d.ts" />
// v2: the page is a scroll scope (lib/scroll-scope); its body reports its own scroll; its header takes `hideOnScroll`.
import * as React from "react";
import { clsx } from "clsx";
import { positionClasses } from "../../position";
import { ScrollScope, useReportScroll, useScrollDirection } from "../../../../lib/scroll-scope";

export function Page({ className, position, children, ...props }: React.ComponentProps<"div">) {
  return <div layout="page" position={position} className={clsx(className, positionClasses(position))} {...props}><ScrollScope>{children}</ScrollScope></div>;
}

export interface PageHeaderProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
  /** the header leaves while the body of its layout is scrolled down, and returns when it is scrolled up (it then carries the flag `away`) */
  hideOnScroll?: boolean;
}

export function PageHeader({ className, position, scale = "md", hideOnScroll = false, ...props }: PageHeaderProps) {
  const away = useScrollDirection() === "down" && hideOnScroll;
  return <div layout="page-header" position={position} scale={scale} flag={away ? "away" : undefined} className={clsx(className, positionClasses(position), hideOnScroll && "overflow-hidden")} {...props} />;
}

export interface SecondPageHeaderProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
}

// A second full-width row under the page header (tabs, a sub-bar). It sits between PageHeader and PageBody.
export function SecondPageHeader({ className, position, scale = "md", ...props }: SecondPageHeaderProps) {
  return <div layout="second-page-header" position={position} scale={scale} className={clsx(className, positionClasses(position))} {...props} />;
}

export function PageBody({ className, position, ...props }: React.ComponentProps<"div">) {
  const ref = useReportScroll<HTMLDivElement>();
  return <div ref={ref} layout="page-body" position={position} className={clsx(className, positionClasses(position))} {...props} />;
}

export interface PageFooterProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
}

// A full-width row under page-body: below both page sidebars and main. Rarely used; always available.
export function PageFooter({ className, position, scale = "md", ...props }: PageFooterProps) {
  return <div layout="page-footer" position={position} scale={scale} className={clsx(className, positionClasses(position))} {...props} />;
}
