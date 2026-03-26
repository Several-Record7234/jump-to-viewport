import { describe, it, expect } from "vitest";
import { mod } from "../helper/helpers";
import {
  metadataId,
  isStarredBox,
  isStarredLegacy,
  isRecord,
  isObject,
  validMetadata,
  isValidStar,
  type Starred,
} from "../helper/types";

describe("mod", () => {
  it("returns correct modulo for positive numbers", () => {
    expect(mod(7, 3)).toBe(1);
    expect(mod(10, 5)).toBe(0);
  });

  it("returns positive modulo for negative numbers", () => {
    // Standard JS % returns negative for negative n; mod() always returns >= 0
    expect(mod(-1, 3)).toBe(2);
    expect(mod(-4, 3)).toBe(2);
  });

  it("returns 0 when n is 0", () => {
    expect(mod(0, 5)).toBe(0);
  });
});

describe("metadataId", () => {
  it("is a non-empty string", () => {
    expect(typeof metadataId).toBe("string");
    expect(metadataId.length).toBeGreaterThan(0);
  });
});

describe("isRecord", () => {
  it("returns true for plain objects", () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord({})).toBe(true);
  });

  it("returns false for arrays, null, dates", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord(new Date())).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isRecord(42)).toBe(false);
    expect(isRecord("string")).toBe(false);
  });
});

describe("isObject", () => {
  it("returns true for objects and arrays", () => {
    expect(isObject({})).toBe(true);
    expect(isObject([])).toBe(true);
  });

  it("returns false for null and primitives", () => {
    expect(isObject(null)).toBe(false);
    expect(isObject(42)).toBe(false);
    expect(isObject("str")).toBe(false);
  });
});

describe("isStarredBox", () => {
  const validBox = {
    id: "abc",
    name: "Test",
    boundingCorners: { max: { x: 10, y: 10 }, min: { x: 0, y: 0 } },
  };

  it("returns true for a valid StarredBox", () => {
    expect(isStarredBox(validBox)).toBe(true);
  });

  it("returns false when boundingCorners is missing", () => {
    expect(isStarredBox({ id: "abc", name: "Test" } as unknown as Starred & Record<string, unknown>)).toBe(false);
  });

  it("returns false when corners have non-numeric coordinates", () => {
    const bad = {
      id: "abc",
      name: "Test",
      boundingCorners: { max: { x: "ten", y: 10 }, min: { x: 0, y: 0 } },
    };
    expect(isStarredBox(bad as unknown as Starred & Record<string, unknown>)).toBe(false);
  });
});

describe("isStarredLegacy", () => {
  const validLegacy = {
    id: "abc",
    name: "Test",
    transform: { position: { x: 0, y: 0 }, scale: 1 },
  };

  it("returns true for a valid StarredLegacy", () => {
    expect(isStarredLegacy(validLegacy)).toBe(true);
  });

  it("returns false when transform is missing", () => {
    expect(isStarredLegacy({ id: "abc", name: "Test" })).toBe(false);
  });

  it("returns false for non-objects", () => {
    expect(isStarredLegacy(null)).toBe(false);
    expect(isStarredLegacy("string")).toBe(false);
  });
});

describe("isValidStar", () => {
  it("returns true for a StarredBox", () => {
    expect(
      isValidStar({
        id: "x",
        name: "v",
        boundingCorners: { max: { x: 1, y: 1 }, min: { x: 0, y: 0 } },
      })
    ).toBe(true);
  });

  it("returns true for a StarredLegacy", () => {
    expect(
      isValidStar({ id: "x", name: "v", transform: { position: { x: 0, y: 0 }, scale: 1 } })
    ).toBe(true);
  });

  it("returns false for objects with neither boundingCorners nor transform", () => {
    expect(isValidStar({ id: "x", name: "v" })).toBe(false);
  });
});

describe("validMetadata", () => {
  it("returns true for valid metadata with empty starredViewports", () => {
    expect(validMetadata({ [metadataId]: { starredViewports: [], filters: {} } })).toBe(true);
  });

  it("returns true for metadata with starredViewports undefined", () => {
    expect(validMetadata({ [metadataId]: { starredViewports: undefined, filters: {} } })).toBe(
      true
    );
  });

  it("returns false for non-objects", () => {
    expect(validMetadata(null)).toBe(false);
    expect(validMetadata("string")).toBe(false);
  });

  it("returns false when metadataId key is absent", () => {
    expect(validMetadata({ other: {} })).toBe(false);
  });
});
