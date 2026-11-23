// A merge's base. It lives in the slice's shared code, which the web side uses.
import { describe, expect, it } from "vitest";
import { findCommonAncestor } from "../../shared/common-ancestor";

const version = (versionId: string, ...sources: string[]) => ({ versionId, sources });

describe("findCommonAncestor", () => {
  it("is the version a branch was cut from", () => {
    const versions = [version("m0"), version("m1", "m0"), version("b0", "m0"), version("b1", "b0"), version("m2", "m1")];
    expect(findCommonAncestor(versions, "m2", "b1")).toBe("m0");
  });

  it("after a merge, is the branch's head that was merged", () => {
    const versions = [version("m0"), version("b0", "m0"), version("b1", "b0"), version("m1", "m0", "b1"), version("b2", "b1"), version("m2", "m1")];
    expect(findCommonAncestor(versions, "m2", "b2")).toBe("b1");
  });

  it("a version and one that follows it share the earlier one", () => {
    expect(findCommonAncestor([version("m0"), version("m1", "m0")], "m0", "m1")).toBe("m0");
  });

  it("is nothing for versions that share none", () => {
    expect(findCommonAncestor([version("a"), version("b")], "a", "b")).toBeNull();
  });
});
