import { Slot } from "@radix-ui/react-slot";
import { defineProps } from "../../../../lib/define-props";
import * as React from "react";

import { Icon } from "../.././icons/v1";

import { Button } from "../.././button/v1";
import { Input } from "../.././input/v1";
import { Separator } from "../.././separator/v1";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "../.././sheet/v1";
import { Header } from "../../parts/v3";
import { Skeleton } from "../.././skeleton/v1";
import { Stack } from "../../stack/v4";
import { Popover, PopoverAnchor, PopoverContent } from "../.././popover/v1";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../.././tooltip/v1";
import { useIsMobile } from "../../../../hooks/use-mobile";
import { cn } from "../../../../lib/utils";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

function readSidebarCookie(): boolean | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`));
  if (!match) return null;
  return match.split("=")[1] === "true";
}

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  const [_open, _setOpen] = React.useState(() => readSidebarCookie() ?? defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          className={cn("group/sidebar-wrapper flex min-h-0", className)}
          {...props}>
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  peek = false,
  peekDelay = 900,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  /** hovering the collapsed sidebar opens its expanded form in a popover over the page, after `peekDelay` ms; ignored while expanded. The collapsed sidebar stays in the flow as the placeholder. */
  peek?: boolean;
  peekDelay?: number;
}) {
  const context = useSidebar();
  const { isMobile, state, openMobile, setOpenMobile } = context;
  const railRef = React.useRef<HTMLDivElement | null>(null);
  const [peekOpen, setPeekOpen] = React.useState(false);
  const peekTimer = React.useRef<number | null>(null);
  const clearPeekTimer = () => { if (peekTimer.current !== null) { window.clearTimeout(peekTimer.current); peekTimer.current = null; } };
  // entering the rail or the panel arms the open (collapsed only) or keeps it open; leaving either closes it after a short grace, so the pointer can cross from one to the other
  // a menu opened from the sidebar (its trigger reports aria-expanded) owns the pointer: hover neither arms nor closes the peek while it is open
  const menuOpen = () => !!(railRef.current?.querySelector('[aria-expanded="true"]') || document.querySelector('[data-sidebar-peek] [aria-expanded="true"]'));
  const armPeek = () => {
    if (!peek || state !== "collapsed" || menuOpen()) return;
    clearPeekTimer();
    if (peekOpen) return;
    peekTimer.current = window.setTimeout(() => { if (!menuOpen()) setPeekOpen(true); }, peekDelay);
  };
  // choosing an item (a link or a plain item, not a menu trigger) restarts the debounce: the peek closes and, the pointer still on the sidebar, opens again after the delay
  const restartPeek = (event: React.MouseEvent) => {
    if (!peek || state !== "collapsed") return;
    const target = event.target as HTMLElement;
    const item = target.closest('a[href], [element="control--sidebar-item"]');
    if (!item || !event.currentTarget.contains(item) || item.hasAttribute("aria-haspopup") || item.hasAttribute("aria-expanded")) return;
    clearPeekTimer();
    setPeekOpen(false);
    peekTimer.current = window.setTimeout(() => { if (!menuOpen()) setPeekOpen(true); }, peekDelay);
  };
  const leavePeek = () => {
    clearPeekTimer();
    if (menuOpen()) return;
    peekTimer.current = window.setTimeout(() => setPeekOpen(false), 150);
  };
  React.useEffect(() => { if (state !== "collapsed") { clearPeekTimer(); setPeekOpen(false); } }, [state]);
  React.useEffect(() => clearPeekTimer, []);

  if (collapsible === "none") {
    return (
      <div
        element="control-group--sidebar"
        className={cn("flex flex-col", className)}
        {...props}>
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          concept="sidebar-sheet"
          className="[&>button]:hidden"
          side={side}>
          <Header className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </Header>
          <SidebarContext.Provider value={{ ...context, state: "expanded", open: true }}>
            <div element="control-group--sidebar" flag="expanded" className="flex h-full w-full flex-col overflow-hidden">{children}</div>
          </SidebarContext.Provider>
        </SheetContent>
      </Sheet>
    );
  }

  const rail = (
    <div
      ref={railRef}
      element="control-group--sidebar"
      className={cn(
        "peer hidden md:flex shrink-0 flex-col overflow-hidden",
        state === "collapsed" ? "w-14" : "w-60",
        className,
      )}
      flag={state === "collapsed" ? "collapsed" : "expanded"}
      {...(state === "collapsed" && { collapsed: "" })}
      {...(peek && { onMouseEnter: armPeek, onMouseLeave: leavePeek, onClick: restartPeek })}
      {...props}
    >
      {children}
    </div>
  );

  if (!peek) return rail;

  return (
    <Popover open={peekOpen && state === "collapsed"} onOpenChange={(next) => { if (!next) { clearPeekTimer(); setPeekOpen(false); } }}>
      <PopoverAnchor asChild>{rail}</PopoverAnchor>
      <PopoverContent
        side={side === "left" ? "right" : "left"}
        align="start"
        avoidCollisions={false}
        sideOffset={-(railRef.current?.offsetWidth ?? 56)}
        concept="sidebar"
        flag={peekOpen && state === "collapsed" ? "peek-open" : "peek-closed"}
        data-sidebar-peek=""
        onOpenAutoFocus={(event) => event.preventDefault()}
        onMouseEnter={armPeek}
        onMouseLeave={leavePeek}
        onClick={restartPeek}
        className="w-60 p-0"
      >
        {/* the panel grows out of the rail and folds back into it: the theme owns the animation, keyed on the flag */}
        <SidebarContext.Provider value={{ ...context, state: "expanded", open: true }}>
          <div element="control-group--sidebar" flag="expanded" className="flex h-full w-full flex-col overflow-hidden">
            {children}
          </div>
        </SidebarContext.Provider>
      </PopoverContent>
    </Popover>
  );
}

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar, state } = useSidebar();

  return (
    <Button
      data-sidebar="trigger"
      emphasis="tertiary"
      scale="sm"
      buttonType="icon"
      startIcon={state === "collapsed" ? "panelLeft" : "panelRight"}
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}>
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(className)}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      className={cn(
        "relative flex flex-1 flex-col min-h-0",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      className={cn(className)}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      element="surface--header"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      element="surface--footer"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={cn(className)}
      {...props}
    />
  );
}

function SidebarContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      element="surface--content"
      className={cn(
        "flex w-full min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto",
        className,
      )}
      {...props}
    >
      <div data-part="inner" className="flex min-h-full flex-col">{children}</div>
    </div>
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("relative flex w-full min-w-0 flex-col", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cn(
        "flex shrink-0 items-center transition-[margin,opacity] duration-200 ease-linear [&>svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "absolute flex items-center justify-center transition-transform [&>svg]:shrink-0",
        "after:absolute after:-inset-2 md:after:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex w-full min-w-0 flex-col", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      className={cn("group/menu-item relative w-full", className)}
      {...props}
    />
  );
}

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  emphasis = "tertiary",
  scale = "md",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  emphasis?: "primary" | "secondary" | "tertiary" | "quiet";
  scale?: "sm" | "md" | "lg";
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
}) {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar();

  const button = (
    <Comp
      element="control--sidebar-item"
      emphasis={emphasis}
      scale={scale}
      {...(!asChild && isActive && { state: "selected" })}
      className={cn(
        "peer/menu-button flex w-full items-center overflow-hidden disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed [&>span:last-child]:truncate [&>svg]:shrink-0",
        state === "collapsed" && "[&>*:not(:first-child)]:hidden",
        className,
      )}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile} {...tooltip} />
    </Tooltip>
  );
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "absolute flex items-center justify-center transition-transform [&>svg]:shrink-0",
        "after:absolute after:-inset-2 md:after:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      element="surface--badge"
      className={cn(
        "pointer-events-none absolute flex items-center justify-center select-none",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      className={cn("flex items-center", className)}
      {...props}>
      {showIcon && <Skeleton />}
      <Skeleton
        className="flex-1"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn(
        "flex min-w-0 translate-x-px flex-col",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  asChild = false,
  scale = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
  scale?: "sm" | "md";
  isActive?: boolean;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      element="control--button"
      scale={scale}
      {...(!asChild && isActive && { state: "selected" })}
      className={cn(
        "flex min-w-0 -translate-x-px items-center overflow-hidden disabled:pointer-events-none disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed [&>span:last-child]:truncate [&>svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

// the props schemas, for tooling: the provider (open state), the button (its own props), the parts without props of their own
const sidebarProviderSchema = defineProps<{ open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void }>("SidebarProvider", { open: { kind: "boolean", doc: "Open (controlled)" }, defaultOpen: { kind: "boolean", default: true, doc: "Open at first" }, onOpenChange: { kind: "function", doc: "(open) — toggled" } });
const sidebarMenuButtonSchema = defineProps<{ asChild?: boolean; isActive?: boolean; emphasis?: "primary" | "secondary" | "tertiary" | "quiet"; scale?: "sm" | "md" | "lg"; tooltip?: string }>("SidebarMenuButton", {
  asChild: { kind: "boolean", default: false, doc: "The child is the button" }, isActive: { kind: "boolean", default: false, doc: "The current place" },
  emphasis: { kind: "enum", values: ["primary", "secondary", "tertiary", "quiet"], default: "tertiary" }, scale: { kind: "enum", values: ["sm", "md", "lg"], default: "md" }, tooltip: { kind: "string", doc: "Shown while the sidebar is collapsed" },
});
/** The item that expands and collapses the sidebar. Its icon and its label follow the sidebar's shape. */
function SidebarToggle({ expandLabel = "Expand", collapseLabel = "Collapse", onClick, ...props }: Omit<React.ComponentProps<typeof SidebarMenuButton>, "children" | "tooltip" | "asChild"> & {
  expandLabel?: string;
  collapseLabel?: string;
}) {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const label = collapsed ? expandLabel : collapseLabel;
  return (
    <SidebarMenuButton emphasis="primary" concept="sidebar-toggle" tooltip={label} onClick={(event) => { onClick?.(event); toggleSidebar(); }} {...props}>
      <Stack dir="row" align="center" justify="center" scale="sm" size="fill">
        <Icon name={collapsed ? "panelLeft" : "panelRight"} scale="sm" />
        <SidebarWhen state="expanded">
          <Stack size="fill" clip><span>{label}</span></Stack>
        </SidebarWhen>
      </Stack>
    </SidebarMenuButton>
  );
}

/** Shows what it holds only while the sidebar is in one shape: `expanded` or `collapsed` (its panel over the page and its sheet count as expanded).
 *  It has no look of its own: it draws its children or nothing. */
function SidebarWhen({ state, children }: { state: "expanded" | "collapsed" | "mobile" | "desktop"; children?: React.ReactNode }) {
  const { state: shape, isMobile } = useSidebar();
  const shown = state === "mobile" ? isMobile : state === "desktop" ? !isMobile : shape === state;
  return shown ? <>{children}</> : null;
}

const sidebarToggleSchema = defineProps<{ expandLabel?: string; collapseLabel?: string }>("SidebarToggle", {
  expandLabel: { kind: "string", doc: "The label while the sidebar is collapsed" },
  collapseLabel: { kind: "string", doc: "The label while the sidebar is expanded" },
});
const sidebarWhenSchema = defineProps<{ state?: string }>("SidebarWhen", { state: { kind: "string", doc: "expanded or collapsed (the shape of the sidebar), mobile or desktop (a phone, where the sidebar is a sheet): when its children are drawn" } });
const sidebarSchema = defineProps<Record<never, never>>("Sidebar", {});
const sidebarHeaderSchema = defineProps<Record<never, never>>("SidebarHeader", {});
const sidebarContentSchema = defineProps<Record<never, never>>("SidebarContent", {});
const sidebarFooterSchema = defineProps<Record<never, never>>("SidebarFooter", {});
const sidebarGroupSchema = defineProps<Record<never, never>>("SidebarGroup", {});
const sidebarMenuSchema = defineProps<Record<never, never>>("SidebarMenu", {});
const sidebarMenuItemSchema = defineProps<Record<never, never>>("SidebarMenuItem", {});

export {
  sidebarProviderSchema, sidebarMenuButtonSchema, sidebarSchema, sidebarHeaderSchema, sidebarContentSchema, sidebarFooterSchema, sidebarGroupSchema, sidebarMenuSchema, sidebarMenuItemSchema,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  SidebarToggle, sidebarToggleSchema,
  SidebarWhen, sidebarWhenSchema,
  useSidebar,
};
