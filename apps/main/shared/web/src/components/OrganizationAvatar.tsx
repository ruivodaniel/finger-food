import { NamedAvatar, type NamedAvatarProps } from "@/components/NamedAvatar";

/** An organization's avatar: its logo or initials, with the name and a detail when asked. */
export function OrganizationAvatar(props: NamedAvatarProps) {
  return <NamedAvatar {...props} />;
}
