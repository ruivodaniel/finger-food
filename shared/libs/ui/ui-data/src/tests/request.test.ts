import { describe, expect, it } from "vitest";
import { isRequestLine, parseRequestLine, toRequest } from "../request";

describe("a request written in a document", () => {
  it("tells a request from a name of the catalog", () => {
    expect(isRequestLine("GET /organizations")).toBe(true);
    expect(isRequestLine("organizations.list")).toBe(false);
  });
  it("reads the method, the path and the names of the path", () => {
    expect(parseRequestLine("GET /organizations/:organizationId/members")).toEqual({ method: "GET", path: "/organizations/:organizationId/members", names: ["organizationId"] });
    expect(parseRequestLine("GET /")).toEqual({ method: "GET", path: "/", names: [] });
  });
  it("refuses a line the dictionary does not allow", () => {
    for (const line of ["FETCH /organizations", "GET organizations", "GET /organizations?page=2", "GET  /organizations", "get /organizations", "GET /a b"]) expect(parseRequestLine(line)).toBeNull();
  });
  it("fills the names of the path; the rest of a GET is its query", () => {
    expect(toRequest("GET /organizations/:organizationId/members", { organizationId: "abc123", page: 2, search: "" })).toEqual({ method: "GET", path: "/organizations/abc123/members", query: { page: "2" } });
    expect(toRequest("GET /organizations")).toEqual({ method: "GET", path: "/organizations" });
  });
  it("puts the rest of any other method in the body", () => {
    expect(toRequest("PATCH /organizations/:organizationId", { organizationId: "abc123", name: "Borealis" })).toEqual({ method: "PATCH", path: "/organizations/abc123", body: { name: "Borealis" } });
  });
  it("throws when a name of the path has no value", () => {
    expect(() => toRequest("GET /organizations/:organizationId", {})).toThrow("needs organizationId");
  });
});
