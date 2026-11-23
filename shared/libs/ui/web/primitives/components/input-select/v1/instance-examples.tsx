import { InputSelect, type InputSelectOption } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

const FRUITS: InputSelectOption[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
  { value: "elderberry", label: "Elderberry" },
  { value: "fig", label: "Fig", disabled: true },
];

const RICH: InputSelectOption[] = [
  { value: "eu-west", label: "Europe West", description: "Dublin, 3 zones", icon: "network", group: "Europe" },
  { value: "eu-central", label: "Europe Central", description: "Frankfurt, 3 zones", icon: "network", group: "Europe" },
  { value: "us-east", label: "US East", description: "Virginia, 6 zones", icon: "network", group: "Americas" },
  { value: "us-west", label: "US West", description: "Oregon, 4 zones", icon: "network", group: "Americas" },
  { value: "ap-south", label: "Asia Pacific South", description: "Mumbai, 3 zones", icon: "network", group: "Asia", keywords: ["india"] },
];

const searchFruits = (q: string) =>
  new Promise<InputSelectOption[]>((resolve) =>
    setTimeout(() => resolve(FRUITS.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()))), 400),
  );

type Shared = Omit<React.ComponentProps<typeof InputSelect>, "multiple" | "value" | "onChange" | "defaultValue">;

/** one select: its value is the data of its instance; a pick writes to it */
function Single({ id, ...props }: Shared & { id: string }) {
  return (
    <Instance id={id} initial={{ data: { value: null } }}>
      {(x) => <InputSelect {...props} {...x.bind("value")} />}
    </Instance>
  );
}

function Multiple({ id, ...props }: Shared & { id: string }) {
  return (
    <Instance id={id} initial={{ data: { value: [] } }}>
      {(x) => <InputSelect {...props} multiple {...x.bind("value")} />}
    </Instance>
  );
}

const col = { display: "flex", flexDirection: "column" as const, gap: 12, width: "100%", maxWidth: 360 };

export default function InputSelectFixture() {
  return (
    <FixtureBody>
      <Row label="single · no search / search in-list / search as-input">
        <div style={col}>
          <Single id="single-none" options={FRUITS} placeholder="Pick a fruit" />
          <Single id="single-in-list" options={FRUITS} search="in-list" placeholder="Pick a fruit" />
          <Single id="single-as-input" options={FRUITS} search="as-input" placeholder="Type a fruit" />
        </div>
      </Row>

      <Row label="multiple · no search / search in-list / search as-input">
        <div style={col}>
          <Multiple id="multiple-none" options={FRUITS} placeholder="Pick fruits" />
          <Multiple id="multiple-in-list" options={FRUITS} search="in-list" placeholder="Pick fruits" />
          <Multiple id="multiple-as-input" options={FRUITS} search="as-input" placeholder="Type fruits" />
        </div>
      </Row>

      <Row label="rich options · icon, description, groups, keywords">
        <div style={col}>
          <Single id="rich" options={RICH} search="in-list" placeholder="Region" />
        </div>
      </Row>

      <Row label="async search · onSearch with delay, loading">
        <div style={col}>
          <Single id="async" onSearch={searchFruits} search="as-input" placeholder="Type to search…" />
        </div>
      </Row>

      <Row label="multiple · creatable, maxSelected 3, one value preset">
        <div style={col}>
          <Instance id="creatable" initial={{ data: { value: ["apple"] } }}>
            {(x) => <InputSelect multiple options={FRUITS} search="as-input" creatable maxSelected={3} {...x.bind("value")} placeholder="Type or create" />}
          </Instance>
        </div>
      </Row>

      <Row label="status · error, warning, success">
        <div style={col}>
          <Single id="status-error" options={FRUITS} status="error" placeholder="Error" />
          <Single id="status-warning" options={FRUITS} status="warning" placeholder="Warning" />
          <Single id="status-success" options={FRUITS} status="success" placeholder="Success" />
        </div>
      </Row>

      <Row label="state · disabled, not clearable">
        <div style={col}>
          <Instance id="state-disabled" initial={{ data: { value: "apple" } }}>
            {(x) => <InputSelect options={FRUITS} disabled {...x.bind("value")} />}
          </Instance>
          <Instance id="state-not-clearable" initial={{ data: { value: "banana" } }}>
            {(x) => <InputSelect options={FRUITS} clearable={false} {...x.bind("value")} />}
          </Instance>
        </div>
      </Row>

      <Row label="scale">
        <div style={col}>
          <Single id="scale-sm" options={FRUITS} scale="sm" placeholder="Small" />
          <Single id="scale-md" options={FRUITS} scale="md" placeholder="Medium" />
          <Single id="scale-lg" options={FRUITS} scale="lg" placeholder="Large" />
        </div>
      </Row>
    </FixtureBody>
  );
}
