import { EmptyState } from "@libs/web-components";
import { FixtureBody, Row } from "../_chrome";

export default function EmptyStateFixture() {
  return (
    <FixtureBody>
      <Row label="scale">
        <EmptyState
          scale="sm"
          title="No results"
          description="Try adjusting your filters."
          action={{ label: "Clear filters", onClick: () => {} }}
        />
        <EmptyState
          scale="md"
          title="No results"
          description="Try adjusting your filters."
          action={{ label: "Clear filters", onClick: () => {} }}
        />
        <EmptyState
          scale="lg"
          title="No results"
          description="Try adjusting your filters."
          action={{ label: "Clear filters", onClick: () => {} }}
        />
      </Row>
      <Row label="with icon">
        <EmptyState
          scale="md"
          iconName="search"
          title="Nothing here"
          description="Start by creating something."
          action={{ label: "Create new", onClick: () => {} }}
        />
      </Row>
    </FixtureBody>
  );
}
