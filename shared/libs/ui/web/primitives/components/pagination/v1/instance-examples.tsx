import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance, type InstanceApi } from "../../../../lib/instance";

const LAST = 12;

/** the current page is the data; a number, Previous or Next writes it */
const pageSetter = (x: InstanceApi) => (x.bind("page") as { onChange: (v: number) => void }).onChange;

export default function PaginationFixture() {
  return (
    <FixtureBody>
      <Row label="Previous (disabled) | 1 | 2 (selected) | 3 | … | 12 | Next">
        <Instance id="page" initial={{ data: { page: 2 } }}>
          {(x) => {
            const page = x.data.page as number;
            const go = pageSetter(x);
            return (
              <Pagination>
                <PaginationContent>
                  <PaginationItem><PaginationPrevious onClick={() => go(Math.max(1, page - 1))} /></PaginationItem>
                  <PaginationItem><PaginationLink isActive={page === 1} onClick={() => go(1)}>1</PaginationLink></PaginationItem>
                  <PaginationItem><PaginationLink isActive={page === 2} onClick={() => go(2)}>2</PaginationLink></PaginationItem>
                  <PaginationItem><PaginationLink isActive={page === 3} onClick={() => go(3)}>3</PaginationLink></PaginationItem>
                  <PaginationItem><PaginationEllipsis /></PaginationItem>
                  <PaginationItem><PaginationLink isActive={page === LAST} onClick={() => go(LAST)}>{LAST}</PaginationLink></PaginationItem>
                  <PaginationItem><PaginationNext onClick={() => go(Math.min(LAST, page + 1))} /></PaginationItem>
                </PaginationContent>
              </Pagination>
            );
          }}
        </Instance>
      </Row>
    </FixtureBody>
  );
}
