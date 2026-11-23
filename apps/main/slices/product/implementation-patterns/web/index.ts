// Public web surface — what a consuming app imports. Pages travel inside the route declaration; everything else under
// web/ is slice-internal.

export { mountImplementationPatternsWeb } from "./services/application/mount";
export type { MountImplementationPatternsWebOptions, ImplementationPatternsHttp, RouterAdapter, ToastAdapter } from "./services/application/mount";
export { getImplementationPatternsRoutes } from "./routes/get-routes";
export type { GetRoutesOptions } from "./routes/get-routes";
export { meteorPresenter } from "./shared/components/meteor-presenter";
