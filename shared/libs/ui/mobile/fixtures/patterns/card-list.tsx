import { Avatar, Badge, Button, Card, EmptyState, Group, Text } from "@libs/mobile-components";
import { Stack } from "@libs/mobile-layouts";
import { FixtureBody } from "../_chrome";

/**
 * Pattern: a list of cards, each with a kind, a title, a line of facts and one action.
 * The content is the coach's Session screen: today's sessions, one to start.
 * Below it, the same group when there is nothing to list.
 */
const SESSIONS = [
  { id: "s-squad", name: "Junior Squad", time: "16:00", venue: "Court 1", kind: "Group session", students: 5 },
  { id: "s-camp", name: "Summer Skills Camp · Day 3", time: "10:00", venue: "Courts 3–4", kind: "Camp", students: 12 },
];

export default function CardListPattern() {
  return (
    <FixtureBody>
      <Group title="You have 2 sessions today. Pick one to run.">
        <Stack gap={12}>
          {SESSIONS.map((s) => (
            <Card key={s.id} testID={`session-${s.id}`}>
              <Stack dir="row" align="center" justify="between" gap={12}>
                <Stack gap={4} size="fill">
                  <Badge emphasis="quiet">{s.kind}</Badge>
                  <Text type="heading4">{s.name}</Text>
                  <Text type="bodySmall" color="gray-500">{s.time} · {s.venue} · {s.students} students</Text>
                </Stack>
                <Button scale="sm" testID={`start-${s.id}`}>Start</Button>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Group>

      <Group title="A card that opens: pressable, with who it is about">
        <Card onPress={() => {}}>
          <Stack dir="row" align="center" gap={12}>
            <Avatar name="Maya Chen" />
            <Stack gap={2} size="fill">
              <Text type="heading4">Maya Chen</Text>
              <Text type="bodySmall" color="gray-500">Age 12 · Tennis</Text>
            </Stack>
            <Badge status="success">Present</Badge>
          </Stack>
        </Card>
      </Group>

      <Group title="When there is nothing">
        <EmptyState icon="calendar" title="No sessions today" description="Nothing is programmed for today." action={<Button emphasis="secondary" scale="sm">Open the schedule</Button>} />
      </Group>
    </FixtureBody>
  );
}
