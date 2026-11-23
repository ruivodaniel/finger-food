/// <reference path="../../react-overrides.d.ts" />
import * as React from "react";
import { clsx } from "clsx";
import { positionClasses } from "../../position";
import { ScrollScope, useReportScroll, useScrollDirection } from "../../../../lib/scroll-scope";

export function Main({ className, position, children, ...props }: React.ComponentProps<"div">) {
  return <div layout="main" position={position} className={clsx(className, positionClasses(position))} {...props}><ScrollScope>{children}</ScrollScope></div>;
}

// =============================================================================
// MainHeader
// =============================================================================

export interface MainHeaderProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
  sticky?: boolean;
  /** the header leaves while the body of its layout is scrolled down, and returns when it is scrolled up (it then carries the flag `away`) */
  hideOnScroll?: boolean;
}

export function MainHeader({ className, position, scale = "md", sticky = false, hideOnScroll = false, ...props }: MainHeaderProps) {
  const away = useScrollDirection() === "down" && hideOnScroll;
  return (
    <div
      layout="main-header"
      position={position}
      scale={scale}
      flag={away ? "away" : undefined}
      {...(sticky && { sticky: "" })}
      className={clsx(className, positionClasses(position), hideOnScroll && "overflow-hidden")}
      {...props}
    />
  );
}

// =============================================================================
// SecondMainHeader — a second full-width row under the main header
// =============================================================================

export interface SecondMainHeaderProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
  sticky?: boolean;
}

export function SecondMainHeader({ className, position, scale = "md", sticky = false, ...props }: SecondMainHeaderProps) {
  return (
    <div
      layout="second-main-header"
      position={position}
      scale={scale}
      {...(sticky && { sticky: "" })}
      className={clsx(className, positionClasses(position))}
      {...props}
    />
  );
}

// =============================================================================
// MainContent — invisible row holding MainBody + MainRightSidebar
// =============================================================================

export function MainContent({ className, position, ...props }: React.ComponentProps<"div">) {
  return <div layout="main-content" position={position} className={clsx(className, positionClasses(position))} {...props} />;
}

// =============================================================================
// MainBody — col (in MainContent) + row (for its children)
// =============================================================================

export function MainBody({ className, position, ...props }: React.ComponentProps<"div">) {
  const ref = useReportScroll<HTMLDivElement>();
  return <div ref={ref} layout="main-body" position={position} className={clsx(className, positionClasses(position))} {...props} />;
}

// =============================================================================
// MainFooter
// =============================================================================

export interface MainFooterProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
}

export function MainFooter({ className, position, scale = "md", ...props }: MainFooterProps) {
  return <div layout="main-footer" position={position} scale={scale} className={clsx(className, positionClasses(position))} {...props} />;
}
