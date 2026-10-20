import type { IconName } from "@libs/web-components";
// Web-surface types — the module's frontend config and adapter contracts.

import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode, ComponentType } from "react";
import type { PreferencesPolicy } from "../shared/types/preferences";

/** A role a selector may assign — value plus its display info. */
export interface RoleOption {
  value: string;
  label: string;
  description?: string;
}

export interface UserOrgMgmtWebConfig {
  /** API origin, e.g. http://localhost:3000 (no trailing slash). */
  apiBaseUrl: string;
  /** Auth surface base path — matches where the app mounts authMount. */
  authPath?: string;
  /** Domain surface base path — matches where the app mounts the router. */
  clientPath?: string;
  /**
   * The membership roles the org UIs may assign, keyed by org type. The app
   * supplies it from its access-control config; the module stays AC-agnostic.
   * A type absent here (or an absent catalog) falls back to free-text entry.
   */
  roleCatalog?: Record<string, RoleOption[]>;
  /**
   * The product's preferences policy — which fields users may change, and
   * whether "follow the system" is offered. The app supplies it from its
   * product config; without it every field shows as set by the product.
   */
  preferences?: PreferencesPolicy;
}

/** Router adapter — the app's router, reduced to what pages need. */
export interface RouterAdapter {
  navigate: (options: {
    to: string;
    search?: Record<string, unknown>;
    /** Replace the current history entry (a hand-off, not a step). */
    replace?: boolean;
  }) => void | Promise<void>;
  currentPath?: () => string;
}

/** Toast adapter — optional user feedback. */
export interface ToastAdapter {
  success: (message: string) => void;
  error: (message: string) => void;
}

/**
 * What an avatar takes. The app injects its own (richer) components of this shape
 * through UserOrgMgmtProviderProps.components; the module ships plain defaults.
 */
export interface AvatarComponentProps {
  name: string;
  image?: string | null;
  scale?: "xs" | "sm" | "md" | "lg";
  /** the name beside the avatar */
  showName?: boolean;
  /** a second line under the name (a contact, a type) */
  detail?: string;
  /** presence, for products that show it */
  presence?: "online" | "offline";
  /** only the image, no initials when there is none */
  imageOnly?: boolean;
  roles?: string[];
  /** data-testid of the avatar, and of the second line */
  testId?: string;
  detailTestId?: string;
}

/** What an empty state takes: a kind (it sets the default icon and the look), the two texts, optional action. */
export interface EmptyStateComponentProps {
  /** nothing-yet: a collection with nothing in it · no-results: a filter matched nothing · unavailable: not there, or not yours */
  kind?: "nothing-yet" | "no-results" | "unavailable";
  title: string;
  description?: ReactNode;
  /** replaces the kind's icon */
  icon?: IconName;
  action?: ReactNode;
  testId?: string;
}

/** A message with a status: the error under a form, the warning on a page. */
export interface StatusAlertComponentProps {
  status: "error" | "warning" | "success" | "info";
  children: ReactNode;
  testId?: string;
}

/** A confirmation the user answers: leave, remove. `children` sits between the text and the buttons (a phrase to type). */
export interface ConfirmModalComponentProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  confirmDisabled?: boolean;
  confirmDisabledReason?: string;
  cancelTestId?: string;
  confirmTestId?: string;
  children?: ReactNode;
}

/** Shared components the app injects. Each is optional: the module falls back to its own default. */
export interface UserOrgMgmtComponents {
  UserAvatar: ComponentType<AvatarComponentProps>;
  OrganizationAvatar: ComponentType<AvatarComponentProps>;
  EmptyState: ComponentType<EmptyStateComponentProps>;
  StatusAlert: ComponentType<StatusAlertComponentProps>;
  ConfirmModal: ComponentType<ConfirmModalComponentProps>;
}

export interface UserOrgMgmtProviderProps {
  config: UserOrgMgmtWebConfig;
  queryClient?: QueryClient;
  router?: RouterAdapter;
  toast?: ToastAdapter;
  components?: Partial<UserOrgMgmtComponents>;
  children: ReactNode;
}
