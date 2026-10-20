import "i18next";
import { enTranslations as en } from "@configs/i18n";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "en";
    resources: {
      en: typeof en;
    };
  }
}
