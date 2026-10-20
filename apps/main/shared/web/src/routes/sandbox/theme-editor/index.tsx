import { createFileRoute, redirect } from "@tanstack/react-router";
import { APP_THEME } from "../../../../../../../../configs/theme";

export const Route = createFileRoute("/sandbox/theme-editor/" as never)({
  beforeLoad: () => {
    throw redirect({
      to: "/sandbox/theme-editor/$themeId" as never,
      params: { themeId: `${APP_THEME.theme}@v${APP_THEME.version}` } as never,
    });
  },
  component: () => null,
});
