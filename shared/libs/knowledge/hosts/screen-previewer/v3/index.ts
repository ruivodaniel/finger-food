// The screen previewer host, clean build. The live play previewer and the player, the screen previewer with its separator, the picture service and the camera, the live screen at its URL, the three mocks it talks to, the data reader they read through.
export { LivePlayPreviewer, type LivePlayPreviewerProps } from "./live-play-previewer/LivePlayPreviewer";
export { PLAY_DEFAULTS, type PlayLayout, type PlayMode, type PlaySize, type PlaySwitches } from "./live-play-previewer/spec";
export { createPlayer, type PlayedPreviewer, type PlayedStep, type Person, type Player, type PlayerState, type SeparatorShown } from "./player/player";
export { ACTS, AFTER_STEP, HOLD, type Gesture } from "./player/acts";
export { createGestures, type Gestures, type Point, type Target } from "./live-screen/gestures";
export { ScreenPreviewer, buildUrl, type PictureService, type ScreenPreviewerHandle, type ScreenPreviewerProps } from "./screen-previewer/ScreenPreviewer";
export { Separator } from "./screen-previewer/Separator";
export { DEFAULTS, DEVICE, type Layout, type Mode, type Size, type Switches } from "./screen-previewer/spec";
export { createLiveScreen, type LiveScreen } from "./live-screen/live-screen";
export { createMockApi, findRecorded, fillResponse, MockApiError, HEADER, type MockApi } from "./mock-api/mock-api";
export { createMockRouter, type MockRouter } from "./mock-router/mock-router";
export { createMockStore, type MockStore } from "./mock-store/mock-store";
export { recording, type DataReader, type Read } from "./reader";
export { createPictureService, ratioText, type Camera, type Cut, type Device, type Key, type MadeWith, type Picture, type PictureServiceCore, type ScreenImage, type ScreenImageStore, type Theme } from "./picture-service/picture-service";
export { createCamera, type CameraBrowser, type CameraWindow } from "./camera/camera";
export { locate, locateSnapshot, type Located } from "./locate";
export { build, fit, parse, PREFIX, type Parsed } from "./url";
export type * from "./model";
