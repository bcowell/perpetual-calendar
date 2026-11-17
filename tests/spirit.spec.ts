import { test, expect } from "@playwright/test";
import { spiritByTeam, spiritLine } from "./spirit";

const standings = (over: object = {}) => ({
  hideSpirit: false,
  standings: [
    { teamID: 1, teamName: "Us", spiritAverage: 5 },
    { teamID: 2, teamName: "Them", spiritAverage: 4.88 },
    { teamID: 3, teamName: "New Team", spiritAverage: null },
  ],
  ...over,
});
const asOf = new Date(2026, 10, 15);

test("reads each team's spirit average", () => {
  const spirit = spiritByTeam(standings());
  expect(spirit.get(1)).toBe(5);
  expect(spirit.get(2)).toBe(4.88);
});

test("skips teams without a spirit score", () => {
  expect(spiritByTeam(standings()).has(3)).toBe(false);
});

test("returns nothing when the league hides spirit or the response is unusable", () => {
  expect(spiritByTeam(standings({ hideSpirit: true })).size).toBe(0);
  expect(spiritByTeam(null).size).toBe(0);
  expect(spiritByTeam({ standings: "nope" }).size).toBe(0);
});

test("formats both teams with the date the scores were read", () => {
  const spirit = spiritByTeam(standings());
  expect(spiritLine(spirit, { id: 1, name: "Us" }, { id: 2, name: "Them" }, asOf))
    .toBe("Spirit (as of Nov 15): Us 5.00 · Them 4.88");
});

test("shows only the team that has a score", () => {
  const spirit = spiritByTeam(standings());
  expect(spiritLine(spirit, { id: 1, name: "Us" }, { id: 3, name: "New Team" }, asOf))
    .toBe("Spirit (as of Nov 15): Us 5.00");
  expect(spiritLine(spirit, { id: 1, name: "Us" }, null, asOf))
    .toBe("Spirit (as of Nov 15): Us 5.00");
});

test("returns null when neither team has a score", () => {
  expect(spiritLine(new Map(), { id: 1, name: "Us" }, { id: 2, name: "Them" }, asOf)).toBeNull();
});
