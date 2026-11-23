import { useState } from "react";
import { Avatar, Button, List, ListItem } from "@libs/mobile-components";
import { AppBar, Body, Drawer, Screen, Stack, TabBar } from "@libs/mobile-layouts";
import { Note, Rows, TABS } from "./_parts";

/** The drawer, open over a root screen: who is signed in, the organizations, what is always there. */
export default function DrawerLayoutFixture() {
  const [open, setOpen] = useState(true);
  return (
    <Screen>
      <AppBar title="Home" start={<Button emphasis="quiet" startIcon="menu" accessibilityLabel="Menu" onPress={() => setOpen(true)} />} />
      <Body>
        <Note>Screen · AppBar · Body · TabBar · Drawer</Note>
        <Rows count={8} />
      </Body>
      <TabBar value="home" items={TABS} />
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        header={<Stack style={{ padding: 16 }}><ListItem title="James Okafor" description="james@riverside.club" start={<Avatar name="James Okafor" />} /></Stack>}
        footer={<List><ListItem title="Settings" start="settings" onPress={() => {}} /></List>}
      >
        <List>
          <ListItem title="Riverside Tennis Club" start="building" selected onPress={() => {}} />
          <ListItem title="Okafor family" start="users" onPress={() => {}} />
        </List>
      </Drawer>
    </Screen>
  );
}
