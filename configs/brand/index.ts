// Brand Configuration — Single Source of Truth
//
// Every product identity value lives here. Both apps import from @configs/brand.
//
// MANUAL SYNC (can't import TS):
//   terraform/deployment/terraform.tfvars -> project_name, domain_name
//   helm/charts/*/values.yaml -> domain, image.repository
//   apps/*/Dockerfile -> pnpm filter names
//   apps/main/shared/web/index.html -> <title> fallback
//   root package.json -> name, script filter names
//   apps/main/shared/mobile/.maestro/*.yml -> appId (must match mobile.bundleId)
//   ios/*/Info.plist, android/app/build.gradle -> native bundle id when prebuild lands

export const Brand = {
  appName: "App",
  appId: "app",
  companyName: "Your Company",
  email: {
    support: "support@example.com",
    noreply: "noreply@example.com",
  },
  logo: {
    default: "/brand/logo.svg",
    light: "/brand/logo-light.svg",
  },
  domain: "example.com",
  mobile: {
    bundleId: "com.example.app",
  },
  legal: {
    termsUrl: "/legal-documents?type=termsAndConditions",
    privacyUrl: "/legal-documents?type=privacyPolicy",
  },
  formats: {
    date: "MMM d yyyy",
    time: "h:mma",
  },
} as const;

export type BrandConfig = typeof Brand;
