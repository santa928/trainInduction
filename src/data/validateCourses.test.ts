import { describe, expect, it } from "vitest";

import { courses } from "./courses";
import { trains } from "./trains";
import { validateCourses } from "./validateCourses";

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
    : T;

const cloneCourses = (): Mutable<typeof courses> =>
  structuredClone(courses) as Mutable<typeof courses>;

describe("validateCourses", () => {
  it("accepts the authored 15-course set", () => {
    expect(validateCourses(trains, courses)).toEqual([]);
  });

  it("rejects gaps that reference missing pieces", () => {
    const broken = cloneCourses();
    broken[0].gaps[0].requiredPieceId = "missing-piece";

    expect(validateCourses(trains, broken)).toContain(
      "course sora-1 gap sora-1-gap-1 requires unknown piece missing-piece",
    );
  });

  it("rejects duplicate course ids", () => {
    const broken = cloneCourses();
    broken[1].id = broken[0].id;

    expect(validateCourses(trains, broken)).toContain("duplicate course id sora-1");
  });

  it("rejects pieces that look identical inside the same course", () => {
    const broken = cloneCourses();
    broken[0].pieces[1].shape = broken[0].pieces[0].shape;
    broken[0].pieces[1].direction = broken[0].pieces[0].direction;

    expect(validateCourses(trains, broken)).toContain("course sora-1 has duplicate-looking piece straight:east");
  });

  it("rejects using one piece as the answer for multiple gaps", () => {
    const broken = cloneCourses();
    broken[1].gaps[1].requiredPieceId = broken[1].gaps[0].requiredPieceId;

    expect(validateCourses(trains, broken)).toContain(
      `course sora-2 uses piece ${broken[1].gaps[0].requiredPieceId} for multiple gaps`,
    );
  });

  it("rejects route points outside the grid", () => {
    const broken = cloneCourses();
    broken[0].path[0].x = 99;

    expect(validateCourses(trains, broken)).toContain("course sora-1 path point 1 is outside the grid");
  });

  it("rejects non-adjacent route points", () => {
    const broken = cloneCourses();
    broken[0].path[1].x = 5;

    expect(validateCourses(trains, broken)).toContain("course sora-1 path point 1 is not adjacent to the next point");
  });

  it("rejects gaps that are not on the route", () => {
    const broken = cloneCourses();
    broken[0].gaps[0].position = { x: 1, y: 1 };

    expect(validateCourses(trains, broken)).toContain("course sora-1 gap sora-1-gap-1 is not on the route");
  });

  it("rejects gaps that are not ordered by arrivalDistance", () => {
    const broken = cloneCourses();
    broken[1].gaps[0].arrivalDistance = 80;

    expect(validateCourses(trains, broken)).toContain(
      "course sora-2 gaps must be ordered by arrivalDistance",
    );
  });

  it("rejects course sets that do not contain exactly 15 courses", () => {
    const broken = cloneCourses().slice(0, 14);

    expect(validateCourses(trains, broken)).toContain("expected 15 courses but found 14");
  });

  it("rejects ids that do not match trainId and difficulty", () => {
    const broken = cloneCourses();
    broken[0].trainId = "mori";
    broken[0].difficulty = 2;

    expect(validateCourses(trains, broken)).toContain(
      "course sora-1 id expects train sora difficulty 1 but found train mori difficulty 2",
    );
  });
});
