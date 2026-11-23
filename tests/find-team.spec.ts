import { test, expect } from "@playwright/test";
import { findTeam } from "./find-team";

const seasons = [
  {
    leagues: [
      { id: 10, weekday: "Monday", teams: [{ id: 1, name: "Spikes" }, { id: 2, name: "Net Gains " }] },
      { id: 11, weekday: "Tuesday", teams: [{ id: 3, name: "Spikes" }] },
    ],
  },
  { leagues: [{ id: 2601, weekday: "Thursday", teams: [{ id: 4, name: "Bump Set" }] }] },
];

test("finds a team by name and weekday", () => {
  const { league, team } = findTeam(seasons, { teamName: "Spikes", dayOfWeek: "Tuesday" });
  expect(league.id).toBe(11);
  expect(team.id).toBe(3);
});

test("ignores trailing spaces in team names", () => {
  expect(findTeam(seasons, { teamName: "Net Gains", dayOfWeek: "Monday" }).team.id).toBe(2);
});

test("with a league id, looks only in that league and ignores the weekday", () => {
  const { league, team } = findTeam(seasons, { leagueId: 2601, teamName: "Bump Set", dayOfWeek: "Monday" });
  expect(league.id).toBe(2601);
  expect(team.id).toBe(4);
});

test("lists the league's teams when the name isn't in it", () => {
  expect(() => findTeam(seasons, { leagueId: 2601, teamName: "Nope" })).toThrow(
    'No team "Nope" in league 2601. Teams: Bump Set'
  );
});

test("says so when the league id doesn't exist", () => {
  expect(() => findTeam(seasons, { leagueId: 999, teamName: "Spikes" })).toThrow("No league 999 in any current season");
});

test("names the weekday when no league that day has the team", () => {
  expect(() => findTeam(seasons, { teamName: "Spikes", dayOfWeek: "Friday" })).toThrow(
    "Could not find team Spikes on Friday"
  );
});
