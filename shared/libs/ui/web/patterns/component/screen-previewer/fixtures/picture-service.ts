// The picture service as the screen previewer reaches it here: the cockpit's server has it at /pictures/<UI snapshot id>. It gives the URL of the picture.
import type { PictureService } from "@libs/knowledge/hosts/screen-previewer";

export const pictureService: PictureService = {
  async picture(uiSnapshotId, device, cut, theme) {
    const q = new URLSearchParams({ device: device.name, width: String(device.width), ratio: String(device.aspectRatio), cut, ...(theme ? { theme } : {}) });
    const answer = await fetch(`/pictures/${encodeURIComponent(uiSnapshotId)}?${q}`);
    if (!answer.ok || !answer.headers.get("Content-Type")?.startsWith("image/")) throw new Error(answer.ok ? "there is no picture service" : await answer.text());
    return URL.createObjectURL(await answer.blob());
  },
};
