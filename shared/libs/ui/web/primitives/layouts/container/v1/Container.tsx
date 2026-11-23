/// <reference path="../../react-overrides.d.ts" />
import * as React from "react";
import { clsx } from "clsx";
import { positionClasses } from "../../position";

export type ContainerScale = "xs" | "sm" | "md" | "lg" | "xl";
export type ContainerAlign = "left" | "center" | "right";

export interface MainContainerProps extends React.ComponentProps<"div"> {
  scale?: ContainerScale;
  align?: ContainerAlign;
}

// The reading measure inside main-body: the theme gives each scale its max-width, the page never writes a number.
export function MainContainer({ className, position, scale = "lg", ...props }: MainContainerProps) {
  return (
    <div
      layout="main-container"
      position={position}
      scale={scale}
      className={clsx(className, positionClasses(position))}
      {...props}
    />
  );
}
