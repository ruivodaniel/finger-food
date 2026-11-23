import { Avatar, Badge, List, ListItem, Switch } from "@libs/mobile-components";
import { FixtureBody, Block } from "../../_chrome";

/** List fixture — rows as a screen uses them: plain, with what stands before and after, pressable, in their states. */
export default function ListFixture() {
  return (
    <FixtureBody>
      <Block title="rows that open something">
        <List>
          <ListItem title="Profile" start="user" onPress={() => {}} />
          <ListItem title="Notifications" description="Push and email" start="bell" onPress={() => {}} />
          <ListItem title="Settings" start="settings" onPress={() => {}} />
        </List>
      </Block>

      <Block title="members — avatar before, badge after">
        <List>
          <ListItem title="James Okafor" description="james@riverside.club" start={<Avatar name="James Okafor" />} end={<Badge>Owner</Badge>} onPress={() => {}} />
          <ListItem title="Lena Fischer" description="lena@riverside.club" start={<Avatar name="Lena Fischer" />} end={<Badge>Member</Badge>} onPress={() => {}} />
          <ListItem title="Gabriel Chen" description="Invited" start={<Avatar name="Gabriel Chen" />} end={<Badge status="warning">Pending</Badge>} onPress={() => {}} />
        </List>
      </Block>

      <Block title="rows that hold a control">
        <List>
          <ListItem title="App lock" description="Ask for the code when the app opens" end={<Switch checked onCheckedChange={() => {}} accessibilityLabel="App lock" />} />
          <ListItem title="Email notifications" end={<Switch checked={false} onCheckedChange={() => {}} accessibilityLabel="Email notifications" />} />
        </List>
      </Block>

      <Block title="state">
        <List>
          <ListItem title="Default" onPress={() => {}} />
          <ListItem title="Active" state="active" onPress={() => {}} />
          <ListItem title="Selected" selected onPress={() => {}} />
          <ListItem title="Disabled" disabled onPress={() => {}} />
        </List>
      </Block>

      <Block title="status">
        <List>
          <ListItem title="Leave organization" status="destructive" start="close" onPress={() => {}} />
        </List>
      </Block>
    </FixtureBody>
  );
}
