/**
 * UserAvatarPicker — the caller's avatar, saved on pick. The picked file
 * uploads through the module's own presign endpoint (server-derived key) and
 * the returned URL is written immediately — the avatar is not part of the
 * profile form's deferred save, so it never waits on unrelated required
 * fields.
 */

import * as React from "react";
import { AvatarUploadField } from "@libs/web-components";
import { useQueryClient } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { queryKeys } from "../../lib/query-keys";
import { ApiError } from "../../lib/api-client";
import { UploadError, uploadImage } from "../../lib/upload";

export interface UserAvatarPickerProps {
  image: string | null | undefined;
  /** Monogram shown while no image is set — follows the name being typed. */
  fallback: string;
  onError: (message: string) => void;
}

export function UserAvatarPicker({
  image,
  fallback,
  onError,
}: UserAvatarPickerProps): React.ReactElement | null {
  const { client } = useUserOrgMgmtContext();
  const queryClient = useQueryClient();
  // The picked file previews instantly while its upload runs; the stored
  // URL takes over once the refreshed profile arrives (or on failure).
  const [picked, setPicked] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);

  const pick = async (file: File) => {
    setPicked(file);
    setSaving(true);
    try {
      const url = await uploadImage(file, (contentType) =>
        client.presignAvatarUpload({ contentType }),
      );
      await client.updateProfile({ image: url });
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
    } catch (e) {
      setPicked(null); // revert the preview — nothing was saved
      onError(
        e instanceof ApiError || e instanceof UploadError
          ? e.message
          : "something went wrong",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AvatarUploadField
      value={picked ?? image}
      onChange={(file) => void pick(file)}
      fallback={fallback}
      uploadLabel="Change avatar"
      disabled={saving}
    />
  );
}
