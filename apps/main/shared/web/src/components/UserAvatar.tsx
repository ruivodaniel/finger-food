import { NamedAvatar, type NamedAvatarProps } from "@/components/NamedAvatar";

/** A user's avatar: their image or initials, with the name, a detail, presence and roles when asked. */
export function UserAvatar(props: NamedAvatarProps) {
  return <NamedAvatar {...props} />;
}
