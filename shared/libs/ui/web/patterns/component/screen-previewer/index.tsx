import { ScreenPreviewer } from "@libs/knowledge/hosts/screen-previewer";
import { Stack } from "@libs/web-components";
import { reader } from "./fixtures/reader";
import { pictureService } from "./fixtures/picture-service";
import type { ScreenPreviewerPatternProps } from "./schema";

/** Pattern: knowledge — the screen previewer (v2) on three UI snapshots and one UI prototype, over the rows in ./fixtures. Each screen inside is a document of its own at its URL,
 *  in the theme its URL names. The previewer holds the page and nothing else. As a picture it asks the picture service, which the cockpit's server has at /pictures.
 *  Its properties are in ./schema. */
export const measure = "xl";

const SNAPSHOTS = ["5a10c001", "5a10c002", "5a10c003"], PROTOTYPE = "b1c97273";

export default function ScreenPreviewerPattern({ layout = "standard", mode = "live", device = "auto", size = "medium", scroll = false, bordered = true, zoomOnClick = false }: ScreenPreviewerPatternProps) {
  const v = { layout, mode, device, size, scroll, bordered, zoomOnClick, reader, pictureService };
  return (
    <Stack dir="col" scale="xl">
      <Stack dir="col" scale="sm">
        <span element="type--heading4">UI snapshots</span>
        <Stack dir="row" scale="xl" align="start" wrap>{SNAPSHOTS.map((id) => <ScreenPreviewer key={id} id={id} {...v} />)}</Stack>
      </Stack>
      <Stack dir="col" scale="sm">
        <span element="type--heading4">UI prototype</span>
        <ScreenPreviewer id={PROTOTYPE} {...v} />
      </Stack>
    </Stack>
  );
}
