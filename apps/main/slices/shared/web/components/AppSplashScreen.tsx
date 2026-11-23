/**
 * App Splash Screen
 *
 * App-owned splash screen with centralized branding + i18n.
 */

import { Card, Content, Header, Spinner } from "@libs/web-components";
import { Brand } from "@configs/brand";
import { useTranslation } from "react-i18next";

export default function AppSplashScreen() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center" data-testid="splash-screen">
      <Card>
        <Header className="flex flex-col items-center">
          <img src={Brand.logo.default} alt={`${Brand.appName} Logo`} className="w-20" />
        </Header>

        <Content className="flex flex-col items-center">
          <Spinner />
          <p element="type--body" emphasis="quiet">{t("common.preparingWorkspace")}...</p>
        </Content>
      </Card>
    </div>
  );
}
