// THE SCREEN PREVIEWER'S LAYOUTS AND SWITCHES, as data. What it shows is always one UI snapshot or one UI prototype; a layout is how it sits in the space it is given.
//   standard     no frame: the device in its own ratio, as wide as the size says (a width for each device)
//   box          a frame of a fixed size, the same for any device; the device fits inside it, whole and centred
//   hug-height   only the width is set, the height follows the content
// `device`: auto = the one the UI node's surface names; desktop and mobile force it. It does not exist in the box, where the device only has to fit.
// `size`: five steps, `fit` (the parent decides the width) and `custom` (customWidth, and customHeight for the box).
// Hovering shows the chrome (not on a box 160 wide or less): open in its own tab and zoom. `zoomOnClick`: a click on the screen opens the zoom too, when the screen itself is not used (a UI snapshot without scroll).
export type Layout = "standard" | "box" | "hug-height";
export type Mode = "live" | "picture";
export type DeviceName = "desktop" | "mobile";
export type Size = "extra-small" | "small" | "medium" | "large" | "extra-large" | "fit" | "custom";

export type Switches = {
  /** live: the page runs · picture: an image of it */
  mode: Mode; device: "auto" | DeviceName; size: Size; customWidth: number; customHeight: number;
  /** the page can be scrolled and used inside its box */
  scroll: boolean; bordered: boolean; chrome: boolean; zoomOnClick: boolean;
  /** a drop shadow around the screen, so its edge is seen without a line on it. The theme gives it (--shadow-screen-previewer), else the sheet's shadow */
  shadow: boolean;
};
export const DEFAULTS: Switches = { mode: "picture", device: "auto", size: "medium", customWidth: 480, customHeight: 360, scroll: false, bordered: true, chrome: true, zoomOnClick: false, shadow: false };

/** the devices: the page's own width, and its window's ratio (width : height) */
export const DEVICE: Record<DeviceName, { name: DeviceName; width: number; aspectRatio: number }> = { desktop: { name: "desktop", width: 1440, aspectRatio: 16 / 9 }, mobile: { name: "mobile", width: 390, aspectRatio: 390 / 844 } };
/** a width for each device, in standard and hug height */
export const WIDTH: Record<DeviceName, Record<string, number>> = {
  desktop: { "extra-small": 240, small: 360, medium: 480, large: 640, "extra-large": 800 },
  mobile: { "extra-small": 110, small: 160, medium: 210, large: 260, "extra-large": 320 },
};
/** the frame of the box (width × height), the same for any device */
export const FRAME: Record<string, [number, number]> = { "extra-small": [240, 180], small: [360, 270], medium: [480, 360], large: [640, 480], "extra-large": [800, 600] };
/** `fit` in the box: the parent gives the width, the frame keeps this ratio */
export const FIT_RATIO = "4 / 3";
/** a box this wide or less is small: no chrome */
export const SMALL = 160;
