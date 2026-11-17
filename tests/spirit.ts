import { format } from "date-fns";

type Team = { id: number; name: string };

/**
 * Spirit averages by team id, from the league standings endpoint. Empty when the league
 * hides spirit or the response isn't usable, so a bad response never breaks the calendar.
 */
export const spiritByTeam = (standings: any): Map<number, number> => {
  const spirit = new Map<number, number>();
  if (!standings || standings.hideSpirit || !Array.isArray(standings.standings)) return spirit;
  for (const row of standings.standings) {
    if (typeof row?.teamID === "number" && typeof row?.spiritAverage === "number") {
      spirit.set(row.teamID, row.spiritAverage);
    }
  }
  return spirit;
};

/** "Spirit (as of Nov 15): Us 5.00 · Them 4.88", or null when neither team has a score. */
export const spiritLine = (
  spirit: Map<number, number>,
  ourTeam: Team,
  opponent: Team | null,
  asOf: Date
): string | null => {
  const scores = [ourTeam, opponent]
    .filter((team): team is Team => !!team && spirit.has(team.id))
    .map((team) => `${team.name} ${spirit.get(team.id)!.toFixed(2)}`);
  return scores.length ? `Spirit (as of ${format(asOf, "MMM d")}): ${scores.join(" · ")}` : null;
};
