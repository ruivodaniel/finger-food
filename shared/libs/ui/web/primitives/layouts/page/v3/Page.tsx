/// <reference path="../../react-overrides.d.ts" />
// v3: every region goes away when it is told to (`away`): it then carries the flag `away` and the theme takes it from there. No region reads a scroll:
// a body tells its own scroll as an event (`onScrollDirection`), and who hears it gives the order.
import * as React from "react";
import { clsx } from "clsx";
import { positionClasses } from "../../position";
import { awayAttrs, awayClass, useTellScroll, type OnScrollDirection } from "../../../../lib/scroll-direction";

export function Page({ className, position, ...props }: React.ComponentProps<"div">) {
  return <div layout="page" position={position} className={clsx(className, positionClasses(position))} {...props} />;
}

export interface PageHeaderProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
  /** the region goes away: it carries the flag `away` */
  away?: boolean;
}

export function PageHeader({ className, position, scale = "md", away, ...props }: PageHeaderProps) {
  return <div layout="page-header" position={position} scale={scale} {...awayAttrs(away)} className={clsx(className, positionClasses(position), awayClass(away))} {...props} />;
}

// A second full-width row under the page header (tabs, a sub-bar). It sits between PageHeader and PageBody.
export interface SecondPageHeaderProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
  /** the region goes away: it carries the flag `away` */
  away?: boolean;
}

export function SecondPageHeader({ className, position, scale = "md", away, ...props }: SecondPageHeaderProps) {
  return <div layout="second-page-header" position={position} scale={scale} {...awayAttrs(away)} className={clsx(className, positionClasses(position), awayClass(away))} {...props} />;
}

export function PageBody({ className, position, onScrollDirection, ...props }: React.ComponentProps<"div"> & { /** told each time its own scroll turns: "down" or "up" */ onScrollDirection?: OnScrollDirection }) {
  const ref = useTellScroll<HTMLDivElement>(onScrollDirection);
  return <div ref={ref} layout="page-body" position={position} className={clsx(className, positionClasses(position))} {...props} />;
}

// A full-width row under page-body: below both page sidebars and main.
export interface PageFooterProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
  /** the region goes away: it carries the flag `away` */
  away?: boolean;
}

export function PageFooter({ className, position, scale = "md", away, ...props }: PageFooterProps) {
  return <div layout="page-footer" position={position} scale={scale} {...awayAttrs(away)} className={clsx(className, positionClasses(position), awayClass(away))} {...props} />;
}

