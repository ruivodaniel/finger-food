// The actions around a to-do tree. They are not part of the tree: a page puts them where it wants (a header, a sidebar, a toolbar), each one a small component with a value in and an event out.
import { useId } from "react";
import { Button, Label, Switch, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { leaves, type Node } from "./TodoTree";

/** "9 left of 12": the things still to do, over all of them (an item with items inside counts by what is inside it) */
export function TodoCount({ nodes }: { nodes: Node[] }) {
  const all = nodes.flatMap(leaves);
  return <Text type="body-small" emphasis="quiet">{all.filter((n) => !n.done).length} left of {all.length}</Text>;
}
/** hides what is done */
export function TodoHideDone({ value, onChange }: { value: boolean; onChange: (hide: boolean) => void }) {
  const id = useId();
  return (
    <Stack dir="row" scale="sm" align="center">
      <Switch id={id} checked={value} onCheckedChange={(c: boolean) => onChange(c)} />
      <Label htmlFor={id}>hide done</Label>
    </Stack>
  );
}
/** the button of a new item: a plus and the words */
export function TodoAddButton({ onClick, label = "New item" }: { onClick: () => void; label?: string }) {
  return <Button emphasis="tertiary" scale="sm" startIcon="add" onClick={onClick}>{label}</Button>;
}
