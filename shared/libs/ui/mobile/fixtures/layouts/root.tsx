import { useState } from "react";
import { Button } from "@libs/mobile-components";
import { AppBar, Body, Screen, TabBar } from "@libs/mobile-layouts";
import { Note, Rows, TABS } from "./_parts";

/** A root screen: the title at the start, the menu before it, the tab bar at the bottom. */
export default function RootLayoutFixture() {
  const [tab, setTab] = useState("home");
  return (
    <Screen>
      <AppBar title="Home" start={<Button emphasis="quiet" startIcon="menu" accessibilityLabel="Menu" />} end={<Button emphasis="quiet" startIcon="bell" accessibilityLabel="Notifications" />} />
      <Body>
        <Note>Screen · AppBar · Body · TabBar</Note>
        <Rows count={12} />
      </Body>
      <TabBar value={tab} onChange={setTab} items={TABS} />
    </Screen>
  );
}
