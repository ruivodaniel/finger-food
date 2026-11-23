// Who is editing a document now, small, for a row of a list: their avatars, and "Ana is editing" (or "2 editing").
// Nothing when nobody is. Watches the document while on screen.
import { Stack } from "@libs/web-layouts";
import { UserAvatar } from "@modules/user-organization-mgmt/web";
import { useDocumentEditors } from "../hooks/use-document-editors";

export function EditingNow({ kind, id }: { kind: string; id: string }) {
  const people = useDocumentEditors(kind, id);
  if (people.length === 0) return null;
  const words = people.length === 1 ? `${people[0]!.actorName} is editing` : `${people.length} editing`;
  return (
    <Stack dir="row" scale="2xs" align="center" title={people.map((person) => person.actorName).join(", ")} data-testid={`editing-now-${id}`}>
      {people.map((person) => (
        <UserAvatar key={person.actorId} name={person.actorName} image={person.actorImage} scale="xs" />
      ))}
      <span element="type--body-small" emphasis="quiet">{words}</span>
    </Stack>
  );
}
