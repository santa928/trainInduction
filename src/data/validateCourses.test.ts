import { describe, expect, it } from "vitest";

import { courses } from "./courses";
import { trains } from "./trains";
import { validateCourses } from "./validateCourses";

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
    : T;

describe("validateCourses", () => {
  it("accepts the authored 15-course set", () => {
    expect(validateCourses(trains, courses)).toEqual([]);
  });

  it("rejects gaps that reference missing pieces", () => {
    const broken = structuredClone(courses) as Mutable<typeof courses>;
    broken[0].gaps[0].requiredPieceId = "missing-piece";

    expect(validateCourses(trains, broken)).toContain(
      "course sora-1 gap sora-1-gap-1 requires unknown piece missing-piece",
    );
  });
});
