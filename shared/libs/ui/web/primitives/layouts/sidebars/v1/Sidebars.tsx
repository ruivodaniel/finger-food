/// <reference path="../../react-overrides.d.ts" />
import * as React from "react";
import { clsx } from "clsx";
import { positionClasses } from "../../position";

// The sidebars, named by the zone they belong to: the page's two columns beside main, and main's own right column.

export interface PageLeftSidebarProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
  collapsed?: boolean;
}

export function PageLeftSidebar({ className, position, scale = "md", collapsed = false, ...props }: PageLeftSidebarProps) {
  return (
    <div
      layout="page-left-sidebar"
      position={position}
      scale={scale}
      {...(collapsed && { state: "collapsed" })}
      className={clsx(className, positionClasses(position))}
      {...props}
    />
  );
}

export interface PageRightSidebarProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
}

export function PageRightSidebar({ className, position, scale = "md", ...props }: PageRightSidebarProps) {
  return <div layout="page-right-sidebar" position={position} scale={scale} className={clsx(className, positionClasses(position))} {...props} />;
}

export interface MainRightSidebarProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
}

export function MainRightSidebar({ className, position, scale = "md", ...props }: MainRightSidebarProps) {
  return <div layout="main-right-sidebar" position={position} scale={scale} className={clsx(className, positionClasses(position))} {...props} />;
}
