// Who is editing the document now: one avatar and name per person, however many tabs they have it in. You show as "(you)".
import { Stack } from "@libs/web-layouts";
import { UserAvatar } from "@modules/user-organization-mgmt/web";
import type { DocumentMember } from "../../../shared/types";
import { mountedApp } from "../../services/application/mount";

export function PresenceBar({ members }: { members: DocumentMember[] }) {
  const { clientId } = mountedApp();
  const me = members.find((member) => member.clientId === clientId)?.actorId;
  const people = [...new Map(members.map((member) => [member.actorId, member])).values()];
  return (
    <Stack dir="row" scale="md" align="center" wrap data-testid="presence-bar">
      <span element="type--body-small" emphasis="quiet">Editing now</span>
      {people.map((person) => (
        <Stack key={person.actorId} dir="row" scale="2xs" align="center">
          <UserAvatar name={person.actorName} image={person.actorImage} scale="xs" showName testId={`presence-${person.actorId}`} />
          {person.actorId === me && <span element="type--body-small" emphasis="quiet">(you)</span>}
        </Stack>
      ))}
    </Stack>
  );
}
