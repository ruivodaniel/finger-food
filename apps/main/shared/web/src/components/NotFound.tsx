/**
 * Not Found Component (404)
 *
 * Self-contained app component with i18n. The module no longer exports
 * a NotFound — fallbacks live where they're rendered.
 */

import { useTranslation } from "react-i18next";

export function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center" data-testid="not-found">
      <h1 element="type--heading2">{t("common.pageNotFound")}</h1>
      <a href="/" element="type--link">
        {t("common.goToHome")}
      </a>
    </div>
  );
}
