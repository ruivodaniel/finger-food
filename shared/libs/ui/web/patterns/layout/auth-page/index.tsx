import * as React from "react";
import { MainContainer } from "../../../primitives/layouts/container";
import { LOREM } from "../_lorem";
import { ShellNone } from "../../../primitives/layouts/shell";
import { Page } from "../../../primitives/layouts/page";

export interface AuthPageProps {
  /** Auth form or card to center in the viewport. */
  children: React.ReactNode;
}

/**
 * AuthPage — full-viewport shell with no navigation, content centered.
 * Use for login, registration, password reset, and other standalone auth flows.
 *
 * Structure: ShellNone → scroll wrapper → Page (centering) → main-container → card
 */
export function AuthPage({ children }: AuthPageProps) {
  return (
    <ShellNone>
      <Page className="flex-1 items-center justify-center">
        <div layout="main-container" scale="xs" className="flex flex-col items-center">
          {children}
        </div>
      </Page>
    </ShellNone>
  );
}

/** the pattern as a fixture: no chrome, a centred container */
export default function Fixture() {
  return (
    <AuthPage>
      <MainContainer>{LOREM}</MainContainer>
    </AuthPage>
  );
}
