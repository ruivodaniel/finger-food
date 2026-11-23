import { Stack, Text, Tile } from "@libs/web-components";
import { VirtualScrollArea, type VirtualPosition } from "./VirtualScrollArea";

// the same function between renders: items already mounted are not drawn again
const cell = ({ row, column }: VirtualPosition) => <Tile className="items-center justify-center"><Text type="body-small">{row},{column}</Text></Tile>;
const line = ({ row }: VirtualPosition) => <Text type="body-small">Row {(row + 1).toLocaleString("en-GB")} of 100,000</Text>;
const step = ({ column }: VirtualPosition) => <Tile className="items-center justify-center"><Text type="body-small">{column + 1}</Text></Tile>;

// each example sits in a box that has the size: the area fills it
export default function VirtualScrollAreaFixture() {
  return (
    <Stack dir="col" scale="xl">
      <Stack dir="col" scale="sm">
        <Text type="body-small" emphasis="quiet">both axes · 500 × 500 items, fixed size</Text>
        <div style={{ display: "flex", flexDirection: "column", height: 320, width: 640 }}>
          <VirtualScrollArea axis="both" label="Grid of 250,000 items" count={{ rows: 500, columns: 500 }} itemSize={{ row: 40, column: 80 }} renderItem={cell} />
        </div>
      </Stack>
      <Stack dir="col" scale="sm">
        <Text type="body-small" emphasis="quiet">y · 100,000 rows, fixed size</Text>
        <div style={{ display: "flex", flexDirection: "column", height: 240, width: 320 }}>
          <VirtualScrollArea label="List of 100,000 rows" count={100000} itemSize={32} renderItem={line} />
        </div>
      </Stack>
      <Stack dir="col" scale="sm">
        <Text type="body-small" emphasis="quiet">x · 10,000 items, fixed size</Text>
        <div style={{ height: 64, width: 640 }}>
          <VirtualScrollArea axis="x" label="Strip of 10,000 items" count={10000} itemSize={64} renderItem={step} className="h-full" />
        </div>
      </Stack>
    </Stack>
  );
}
